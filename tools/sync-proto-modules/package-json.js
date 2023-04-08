const { readFile } = require( 'fs/promises' );
const { resolve } = require( 'path' );

const { memoize, cloneDeep, defaultsDeep, uniq } = require( 'lodash' );
const semver = require( 'semver' );

const { syncFile, formatPackage, getDocsUrl } = require( './utils' );
const { resolveRoot } = require( '../utils' );

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler<{getProtoPkg: (v: string) => Promise<string>, rootJson: any, rootJsonStr: string, rootPath: string}}
 */
module.exports.packageJson = async checkOnly => ( {
	setup: async () => {
		const getProtoPkg = memoize( proto => readFile( resolve( proto, 'package.json' ), 'utf-8' ) );
		const rootPath = resolveRoot( 'package.json' );
		const rootJsonStr = await readFile( rootPath, 'utf-8' );
		const rootJson = JSON.parse( rootJsonStr );
		return { getProtoPkg, rootJson, rootJsonStr, rootPath };
	},
	run: async ( proto, { path: projectPath, pkgJsonPath, pkgJson }, projects, _, { getProtoPkg, rootJson: rootPackageJson } ) => {
		const protoPkgContent = await getProtoPkg( proto );
		const protoPkg = JSON.parse( protoPkgContent
			.replace( /\{projectRelDir\}/g, projectPath )
			.replace( /\{projectTypeDocUrl\}/g, getDocsUrl( pkgJson ) ) );
		const newProjectPkg = defaultsDeep( cloneDeep( protoPkg ), pkgJson );
		[ 'keywords', 'files' ].forEach( prop => newProjectPkg[prop] = uniq( [
			...( protoPkg[prop] ?? [] ),
			...( pkgJson[prop] ?? [] ),
		]
			.map( k => k.toLowerCase() ) )
			.sort() );
		await syncFile( checkOnly, pkgJsonPath, await formatPackage( newProjectPkg ) );

		rootPackageJson['devDependencies'] = rootPackageJson['devDependencies'] ?? {};
		Object.entries( syncFile )
			.filter( ( [ k ] ) => k.toLowerCase().includes( 'dependencies' ) )
			.forEach( ( [ k, v ] ) => {
				const rootPkgDeps = rootPackageJson['devDependencies'] ?? {};
				const filteredDeps = Object.fromEntries( Object.entries( v )
					.filter( ( [ depName, depV ] ) => {
						if( projects.some( p => p.pkgName === depName ) ){
							return false;
						}
						if( k === 'peerDependencies' && semver.satisfies( semver.minVersion( rootPkgDeps[depName] ), depV ) ){
							return false;
						}
						if( depName in rootPkgDeps && rootPkgDeps[depName] !== depV ){
							console.warn( `Mismatching ${k} ${depName} from ${projectPath}: ${rootPkgDeps[depName]} in root vs ${depV} in pkg` );
						}
						return true;
					} ) );
				rootPackageJson['devDependencies'] = {
					...rootPkgDeps,
					...filteredDeps,
				};
			} );
	},
	tearDown: async( proto, projects, _, { rootJson, rootPath } ) => {
		rootJson['devDependencies'] = {
			...rootJson['devDependencies'],
			...Object.fromEntries( projects.map( p => [ p.pkgName, `file:${p.path}` ] ) ),
		};
		await syncFile( checkOnly, rootPath, await formatPackage( rootJson ) );
	},
	handleFile: filename => /(\/|^)package\.json$/.test( filename ),
} );
