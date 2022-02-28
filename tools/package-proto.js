const assert = require( 'assert' );
const { createHash } = require( 'crypto' );
const { readFile, writeFile, mkdir, copyFile, access } = require( 'fs/promises' );
const { resolve, join } = require( 'path' );

const { bold } = require( 'chalk' );
const { defaultsDeep, partition, memoize, isString, cloneDeep, uniq } = require( 'lodash' );

const { spawn, globAsync, selectProjects, createStash } = require( './utils' );

/**
 * @typedef {import('./utils').Project} Project
 */
/**
 * @typedef {{
 * 	setup?: (proto: string; projects: Project[]) => Promise<void>;
 * 	tearDown?: (proto: string; projects: Project[]) => Promise<void>;
 * 	run: (proto: string; project: Project) => Promise<void>;
 * }} ProtoHandler
 */

/**
 * @returns {ProtoHandler}
 */
const packageJson = () => {
	const getProtoPkg = memoize( proto => readFile( resolve( proto, 'package.json' ), 'utf-8' ) );
	return {
		run: async ( proto, { path: projectPath } ) => {
			const protoPkgContent = await getProtoPkg( proto );
			const protoPkg = JSON.parse( protoPkgContent
				.replace( /\{projectRelDir\}/g, projectPath ) );
			const projectPkgPath = resolve( projectPath, 'package.json' );
			let projectPkg;
			try {
				projectPkg = require( projectPkgPath );
			} catch( e ){
				if( e.code === 'MODULE_NOT_FOUND' ){
					projectPkg = {};
				} else {
					throw e;
				}
			}
			const newProjectPkg = defaultsDeep( cloneDeep( protoPkg ), projectPkg );
			[ 'keywords', 'files' ].forEach( prop => newProjectPkg[prop] = uniq( [
				...( protoPkg[prop] ?? [] ),
				...( projectPkg[prop] ?? [] ),
			]
				.map( k => k.toLowerCase() ) )
				.sort() );
			await writeFile( projectPkgPath, JSON.stringify( newProjectPkg, null, 2 ) );
		},
		tearDown: async( proto, projects ) => {
			await spawn( 'npx', [ 'format-package', '--write', ...projects.map( p => resolve( p.path, 'package.json' ) ) ] );
		},
	};
};

const checksum = async file => createHash( 'md5' )
	.update( await readFile( file, 'utf-8' ), 'utf-8' )
	.digest( 'hex' );

/**
 * @returns {ProtoHandler}
 */
const syncFs = () => {
	const cacheFile = resolve( __dirname, '.package-proto-cache' );
	const readCache = memoize( async () => {
		try {
			const cacheContent = await readFile( cacheFile, 'utf-8' );
			return cacheContent
				.split( '\n' )
				.filter( v => v.trim() )
				.reduce( ( acc, line ) => {
					const parts = line.split( '::' ).map( p => p.trim() );
					if( parts.length === 0 ){
						return acc;
					}
					assert( parts.length === 2 );
					const [ file, hash ] = parts;
					acc[file] = hash;
					return acc;
				}, {} );
		} catch( e ){
			return {};
		}
	} );
	const protoFs = memoize( async proto => {
		const filesDirs = ( await globAsync( '**', { cwd: proto, ignore: [ '**/node_modules/**' ], mark: true, dot: true } ) )
			.filter( fd => !/(\/|^)package\.json$/.test( fd ) );
		const [ dirs, files ] = partition( filesDirs, p => p.endsWith( '/' ) );
		return { dirs, files };
	} );
	const getChangedFiles = memoize( async proto => {
		const [ cacheContent, { files } ] = await Promise.all( [
			readCache(),
			protoFs( proto ),
		] );
		const changedFiles = {};
		await Promise.all( files.map( async file => {
			const hash = await checksum( resolve( proto, file ) );
			if( !cacheContent[file] || cacheContent[file] !== hash ){
				changedFiles[file] = hash;
			}
		} ) );
		Object.keys( cacheContent ).forEach( k => {
			if( !files.includes( k ) ){
				changedFiles[k] = undefined;
			}
		} );
		return changedFiles;
	} );
	const conflicting = [];
	return {
		run: async ( proto, { path: projectPath } ) => {
			const { dirs } = await protoFs( proto );
			for( const dir of dirs ){
				await mkdir( resolve( projectPath, dir ), { recursive: true } );
			}
			const changedFiles = await getChangedFiles( proto );
			await Promise.all( Object.entries( changedFiles ).map( async ( [ file, protoSum ] ) => {
				const source = resolve( proto, file );
				const dest = resolve( projectPath, file );
				try{
					await access( dest );
					const prevSum = ( await readCache() )[file];
					if( ( prevSum ?? protoSum ) !== await checksum( dest ) ){
						conflicting.push( join( projectPath, file ) );
					}
				} catch( err ){
					if ( err.code !== 'ENOENT' ) {
						throw err;
					}
				}
				await copyFile( source, dest );
			} ) );
		},
		tearDown: async proto => {
			conflicting.forEach( c => {
				console.error( `File ${bold( c )} has been changed compared to prototype. Please review git changes.` );
			} );
			const [ cache, changed ] = await Promise.all( [
				readCache(),
				getChangedFiles( proto ),
			] );
			const newCache = {
				...cache,
				...changed,
			};
			await writeFile( cacheFile, Object.entries( newCache )
				.filter( ( [ , v ] ) => isString( v ) )
				.map( entry => entry.join( ' :: ' ) )
				.join( '\n' ) );
		},
	};
};

if( require.main === module ){
	const { explicitProjects, noStash } = process.argv.slice( 2 )
		.reduce( ( acc, arg ) => {
			if( arg === '--no-stash' ){
				return { ...acc, noStash: true };
			} else {
				return { ...acc, explicitProjects: [ ...acc.explicitProjects, arg ] };
			}
		}, { explicitProjects: [], noStash: false } );
	const projects = selectProjects( explicitProjects );
	const protoDir = resolve( __dirname, 'proto' );
	( async () => {
		if( !noStash ){
			await createStash( `Sync packages ${projects.map( p => p.name ).join( ' ' )}` );
		}
		const handlers = [
			syncFs(),
			packageJson(),
		];
		for( const { setup } of handlers ){
			await setup?.( protoDir, projects );
		}
		for( const { run } of handlers ){
			await Promise.all( projects.map( p => run( protoDir, p ) ) );
		}
		for( const { tearDown } of handlers ){
			await tearDown?.( protoDir, projects );
		}
	} )();
}

