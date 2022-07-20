const assert = require( 'assert' );
const { readFile, writeFile } = require( 'fs/promises' );
const { resolve } = require( 'path' );

const { memoize, cloneDeep, defaultsDeep, uniq } = require( 'lodash' );
const { normalizePath } = require( 'typedoc' );

const { formatPackages, checkFormatPackages, resolveRoot } = require( '../utils' );
const { readProjectPackageJson, getDocsUrl } = require( './utils' );

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler}
 */
module.exports.packageJson = async checkOnly => {
	const getProtoPkg = memoize( proto => readFile( resolve( proto, 'package.json' ), 'utf-8' ) );
	const rootPackageJsonPath = resolveRoot( 'package.json' );
	const rootPackageJsonStr = await readFile( rootPackageJsonPath, 'utf-8' );
	const rootPackageJson = JSON.parse( rootPackageJsonStr );
	return {
		run: async ( proto, { path: projectPath }, projects ) => {
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

			Object.entries( packageContent )
				.filter( ( [ k ] ) => k.toLowerCase().includes( 'dependencies' ) )
				.forEach( ( [ k, v ] ) => {
					const rootPkgDeps = rootPackageJson[k] ?? {};
					const filteredDeps = Object.fromEntries( Object.entries( v )
						.filter( ( [ depName, depV ] ) => {
							if( depName in rootPkgDeps && rootPkgDeps[depName] !== depV ){
								console.warn( `Mismatching dependency ${depName} from ${projectPath}: ${rootPkgDeps[depName]} so far vs ${depV}` );
								rootPkgDeps[depName] = depV;
							} else if( !projects.some( p => require( resolve( p.path, 'package.json' ) ).name === depName ) ){
								return [ depName, depV ];
							}
						} ) );
					rootPackageJson[k] = {
						...rootPkgDeps,
						...filteredDeps,
					};
				} );
		},
		tearDown: async( proto, projects ) => {
			Object.entries( rootPackageJson )
				.filter( ( [ k ] ) => k.toLowerCase().includes( 'dependencies' ) )
				.forEach( ( [ , v ] ) => {
					projects.forEach( p => {
						const projectName = require( resolve( p.path, 'package.json' ) ).name;
						delete v[projectName];
					} );
				} );
			rootPackageJson.devDependencies = {
				...rootPackageJson.devDependencies,
				...Object.fromEntries( projects.map( p => [ require( resolve( p.path, 'package.json' ) ).name, `file:${p.path}` ] ) ),
			};
			await writeFile( rootPackageJsonPath, `${JSON.stringify( rootPackageJson, null, 2 )  }\n` );
			if( checkOnly ){
				try {
					await checkFormatPackages( rootPackageJsonPath );
					assert.equal( await readFile( rootPackageJsonPath, 'utf-8' ), rootPackageJsonStr, 'Root package.json changed' );
				} finally {
					await writeFile( rootPackageJsonPath, rootPackageJsonStr );
				}
			} else {
				await formatPackages( rootPackageJsonPath, ...projects.map( p => normalizePath( resolve( p.path, 'package.json' ) ) ) );
			}
		},
		handleFile: filename => /(\/|^)package\.json$/.test( filename ),
	};
};
