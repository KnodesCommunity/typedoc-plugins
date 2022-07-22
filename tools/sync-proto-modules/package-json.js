const assert = require( 'assert' );
const { readFile, writeFile } = require( 'fs/promises' );
const { resolve } = require( 'path' );

const { memoize, cloneDeep, defaultsDeep, uniq } = require( 'lodash' );
const semver = require( 'semver' );
const { normalizePath } = require( 'typedoc' );

const { formatPackages, resolveRoot } = require( '../utils' );
const { readProjectPackageJson, getDocsUrl, assertDiffFile } = require( './utils' );

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler<{getProtoPkg: (v: string) => string, rootJson: any, rootJsonStr: string, rootPath: string}}
 */
module.exports.packageJson = async checkOnly => ( {
	setup: async () => {
		const getProtoPkg = memoize( proto => readFile( resolve( proto, 'package.json' ), 'utf-8' ) );
		const rootPath = resolveRoot( 'package.json' );
		const rootJsonStr = await readFile( rootPath, 'utf-8' );
		const rootJson = JSON.parse( rootJsonStr );
		return { getProtoPkg, rootJson, rootJsonStr, rootPath };
	},
	run: async ( proto, { path: projectPath }, projects, _, { getProtoPkg, rootJson: rootPackageJson } ) => {
		const { packageContent = {}, path: packagePath } = await readProjectPackageJson( projectPath ) ?? {};
		const protoPkgContent = await getProtoPkg( proto );
		const protoPkg = JSON.parse( protoPkgContent
			.replace( /\{projectRelDir\}/g, projectPath )
			.replace( /\{projectTypeDocUrl\}/g, getDocsUrl( packageContent ) ) );
		const newProjectPkg = defaultsDeep( cloneDeep( protoPkg ), packageContent );
		[ 'keywords', 'files' ].forEach( prop => newProjectPkg[prop] = uniq( [
			...( protoPkg[prop] ?? [] ),
			...( packageContent[prop] ?? [] ),
		]
			.map( k => k.toLowerCase() ) )
			.sort() );
		if( checkOnly ){
			assert.deepStrictEqual( newProjectPkg, packageContent );
		} else {
			await writeFile( packagePath, JSON.stringify( newProjectPkg, null, 2 ) );
		}

		rootPackageJson['devDependencies'] = rootPackageJson['devDependencies'] ?? {};
		Object.entries( packageContent )
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
	tearDown: async( proto, projects, _, { rootJson: rootJson, rootJsonStr: rootJsonStr, rootPath } ) => {
		rootJson['devDependencies'] = {
			...rootJson['devDependencies'],
			...Object.fromEntries( projects.map( p => [ p.pkgName, `file:${p.path}` ] ) ),
		};
		await writeFile( rootPath, `${JSON.stringify( rootJson, null, 2 )  }\n` );
		if( checkOnly ){
			try {
				await formatPackages( rootPath );
				await assertDiffFile( rootPath, rootJsonStr, true );
			} finally {
				await writeFile( rootPath, rootJsonStr );
			}
		} else {
			await formatPackages( rootPath, ...projects.map( p => normalizePath( resolve( p.path, 'package.json' ) ) ) );
		}
	},
	handleFile: filename => /(\/|^)package\.json$/.test( filename ),
} );
