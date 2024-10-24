import { exec as _exec, spawn as _spawn } from 'child_process';
import { createRequire } from 'module';
import { relative, resolve } from 'path';
import { Readable, Stream, Writable } from 'stream';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

import { sync as globSync } from 'glob';
import _ from 'lodash';
const { isArray, isNil, omitBy, once } = _;

export const exec = promisify( _exec );

/**
 * @param {string} cmd
 * @param {string[]=} args
 * @param {import('child_process').SpawnOptionsWithoutStdio=} opts
 */
export const spawn = ( cmd, args, opts = {} ) => new Promise( ( res, rej ) => {
	const { stdio } = opts;
	if( !opts.stdio ){
		opts.stdio = [ null, process.stdout, process.stderr ];
	}
	if( stdio && isArray( stdio ) ){
		opts.stdio = stdio.map( ( s, i ) => i <= 2 && s instanceof Stream ? 'pipe' : s );
	}
	const p = _spawn( cmd, args, opts );
	if( stdio && isArray( stdio ) ){
		stdio[0] instanceof Readable && stdio[0].pipe( p.stdin );
		stdio[1] instanceof Writable && p.stdout.pipe( stdio[1] );
		stdio[2] instanceof Writable && p.stderr.pipe( stdio[2] );
	}
	p.on( 'close', code => {
		const out = omitBy( {
			stdout: stdio?.[1]?.CAPTURE === true ? stdio[1].read() : undefined,
			stderr: stdio?.[2]?.CAPTURE === true ? stdio[2].read() : undefined,
			code,
		}, isNil );
		if( code !== 0 ) {
			const err = new Error( `Exit code ${code}: ${JSON.stringify( {
				cmd: [ cmd, ...args ],
				cwd: opts.cwd,
			} )}` );
			return rej( Object.assign( err, out ) );
		} else {
			return res( out );
		}
	} );
} );

/**
 * @returns {Writable & {read: () => string}}
 */
export const captureStream = () => {
	const stream = new Writable();
	const data = [];
	// eslint-disable-next-line no-underscore-dangle -- Expected
	stream._write = ( chunk, encoding, next ) => {
		data.push( chunk.toString() );
		next();
	};
	stream.read = () => {
		stream.end();
		return data.join( '\n' );
	};
	stream.CAPTURE = true;
	return stream;
};

/**
 * @typedef {{
 * 	id: string,
 * 	name: string,
 * 	path: string,
 * 	absPath: string,
 * 	pkgName: string,
 * 	pkgJson: import('type-fest').PackageJson.PackageJsonStandard,
 * 	pkgJsonPath: string
 * }} Project
 */

/**
 * @type {() => Project[]}
 */
export const getProjects = once( () => {
	const require = createRequire( import.meta.url );
	const packages = require( '../package.json' ).workspaces
		.map( w => globSync( w, { ignore: 'node_modules/**' } ) )
		.flat();
	let names = packages.slice();
	while( names.every( ( n => n[0] === names[0][0] ) ) ){
		names = names.map( n => n.slice( 1 ) );
	}
	return packages
		.map( ( p, i ) => {
			const pkgJsonPath = resolve( dirname, '..', p, 'package.json' );
			const pkgJson = require( pkgJsonPath );
			return {
				id: relative( './packages', p ),
				path: p,
				absPath: resolveRoot( p ),
				name: names[i],
				pkgJson,
				pkgName: pkgJson.name,
				pkgJsonPath,
			};
		} );
} );

/**
 * @param {string} label
 */
export const createStash = async label => {
	const message = `REPO SNAPSHOT '${label}'`;
	await spawn( 'git', [ 'stash', 'push', '--all', '--message', message ], { stdio: [ null, null, process.stderr ] } );
	console.log( `Created a stash "${message}"` );
	await spawn( 'git', [ 'stash', 'apply', 'stash@{0}' ] );
};

export const commonPath = ( input, sep = '/' ) => {
	if( input.length <= 1 ){
		return input[0];
	}
	/**
	 * Given an array of strings, return an array of arrays, containing the
	 * strings split at the given separator
	 *
	 * @param {Array<string>} a - A
	 * @returns {Array<Array<string>>} B
	 */
	const splitStrings = a => a.map( i => i.split( sep ) );

	/**
	 * Given an index number, return a function that takes an array and returns the
	 * element at the given index
	 *
	 * @param {number} i - The index.
	 * @returns {function(Array<*>): *} - FP helper taking an array.
	 */
	const elAt = i => a => a[i];

	/**
	 * Transpose an array of arrays:
	 * Example:
	 * [['a', 'b', 'c'], ['A', 'B', 'C'], [1, 2, 3]] ->
	 * [['a', 'A', 1], ['b', 'B', 2], ['c', 'C', 3]]
	 *
	 * @param {Array<Array<*>>} a - A
	 * @returns {Array<Array<*>>} B
	 */
	const rotate = a => a[0].map( ( e, i ) => a.map( elAt( i ) ) );

	/**
	 * Checks of all the elements in the array are the same.
	 *
	 * @param {Array<*>} arr - Arr
	 * @returns {boolean} `true` if arr[0] === arr[1] === arr[2]...
	 */
	const allElementsEqual = arr => arr.every( e => e === arr[0] );

	return rotate( splitStrings( input, sep ) )
		.filter( allElementsEqual ).map( elAt( 0 ) ).join( sep );
};

export const selectProjects = explicitProjects => {
	const allProjects = getProjects();
	const nonExistingProjects = explicitProjects.filter( p => !allProjects.find( pp => pp.name === p ) );
	if( nonExistingProjects.length > 0 ){
		throw new Error( `Specified missing projects ${JSON.stringify( nonExistingProjects )}` );
	}
	return explicitProjects.length === 0 ?
		allProjects :
		allProjects.filter( p => explicitProjects.includes( p.name ) );
};

const formatPackagesBin = process.platform === 'win32' ? '.\\node_modules\\.bin\\format-package.cmd' : './node_modules/.bin/format-package';
/**
 * @param {string[]} packages
 */
export const formatPackages = ( ...packages ) => spawn( formatPackagesBin, [ '--write', ...packages.map( p => normalizePath( p ) ) ] );
/**
 * @param {string[]} packages
 */
export const checkFormatPackages = ( ...packages ) => spawn( formatPackagesBin, [ '--check', ...packages.map( p => normalizePath( p ) ) ] );

/**
 * @param {string[]} filesList
 */
export const getStagedFiles = async ( ...filesList ) => {
	const stagedPatchesOutput = captureStream();
	if( filesList && filesList.length > 0 ){
		filesList.unshift( '--' );
	}
	await spawn( 'git', [ 'diff', '--name-only', '--cached', ...filesList ], { stdio: [ null, stagedPatchesOutput, null ] } );
	return stagedPatchesOutput.read().split( /\r?\n/ ).filter( v => v );
};

const dirname = fileURLToPath( new URL( '.', import.meta.url ) );
export const resolveRoot = ( ...paths ) => resolve( dirname, '..', ...paths );
export const relativeToRoot = path => relative( resolve( dirname, '..' ), path );

export const normalizePath = path => path.replace( /\\/g, '/' );
