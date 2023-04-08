import assert, { equal, fail } from 'assert';
import { createHash } from 'crypto';
import { access, copyFile, mkdir, readFile, unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

import chalk from 'chalk';
import { glob } from 'glob';
import _ from 'lodash';

import { syncFile, tryReadFile } from './utils/index.mjs';

const checksum = async file => createHash( 'md5' )
	.update( ( await readFile( file, 'utf-8' ) ).replace( /\r?\n/g, '\n' ), 'utf-8' )
	.digest( 'hex' );

const cacheFile = resolve( fileURLToPath( new URL( '.', import.meta.url ) ), '../.sync-proto-cache' );
const readCache = _.memoize( async () => {
	try {
		const cacheContent = ( await tryReadFile( cacheFile, 'utf-8' ) ) ?? '';
		return cacheContent
			.split( /\r?\n/ )
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

const protoFs = _.memoize( async ( proto, handlers ) => {
	const filesDirs = ( await glob( '**', { cwd: proto, ignore: [ '**/node_modules/**' ], mark: true, dot: true } ) )
		.filter( fd => !( handlers.some( h => h.handleFile?.( fd ) ?? false ) ) );
	const [ dirs, files ] = _.partition( filesDirs, p => p.endsWith( '/' ) );
	return { dirs, files };
} );

const getChangedFiles = _.memoize( async ( proto, handlers ) => {
	const [ cacheContent, { files } ] = await Promise.all( [
		readCache(),
		protoFs( proto, handlers ),
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

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils/index.mjs').ProtoHandler}
 */
export const syncFs = checkOnly => {
	const conflicting = [];
	return {
		name: 'syncFs',
		run: async ( proto, { path: projectPath }, _projects, handlers ) => {
			try {
				const { dirs, files } = await protoFs( proto, handlers );
				for( const dir of dirs ){
					await mkdir( resolve( projectPath, dir ), { recursive: true } );
				}
				const changedFiles = await getChangedFiles( proto, handlers );
				if( checkOnly ){
					const changedFilesNames = Object.keys( changedFiles );
					equal( changedFilesNames.length, 0, `Some files has changed compared to prototype. ${changedFilesNames.join( ' ' )}` );
				} else {
					await Promise.all( Object.entries( changedFiles ).map( async ( [ file, protoSum ] ) => {
						const source = resolve( proto, file );
						const dest = resolve( projectPath, file );
						if( protoSum ){
							try{
								await access( dest );
								const prevSum = ( await readCache() )[file];
								if( ( prevSum ?? protoSum ) !== await checksum( dest ) ){
									const projectFile = join( projectPath, file );
									conflicting.push( projectFile );
								}
							} catch( err ){
								if ( err.code !== 'ENOENT' ) {
									throw err;
								}
							}
							await copyFile( source, dest );
						} else {
							try{
								await unlink( dest );
							// eslint-disable-next-line no-empty -- No error
							} catch( e ){}
						}
					} ) );
				}
				await Promise.all( files.map( async file => {
					if( file in changedFiles ){
						return;
					}
					const absFile = resolve( projectPath, file );
					try{
						await access( absFile );
					} catch( e ){
						if( checkOnly ){
							fail( `Missing ${absFile}` );
						}
						await copyFile( resolve( proto, file ), absFile );
					}
				} ) );
			} catch( e ){
				throw new Error( `Error in package ${projectPath}`, { cause: e } );
			}
		},
		tearDown: async ( proto, _projects, handlers ) => {
			if( checkOnly ){
				return;
			}
			conflicting.forEach( c => {
				console.error( `File ${chalk.bold( c )} has been changed compared to prototype. Please review git changes.` );
			} );
			const [ cache, changed ] = await Promise.all( [
				readCache(),
				getChangedFiles( proto, handlers ),
			] );
			const newCache = {
				...cache,
				...changed,
			};
			await syncFile( checkOnly, cacheFile, Object.entries( newCache )
				.filter( ( [ , v ] ) => _.isString( v ) )
				.map( entry => entry.join( ' :: ' ) )
				.join( '\n' ) );
		},
	};
};
