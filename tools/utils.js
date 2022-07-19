const { exec: _exec, spawn: _spawn } = require( 'child_process' );
const { Writable, Stream, Readable } = require( 'stream' );
const { promisify } = require( 'util' );

const glob = require( 'glob' );
const { once, isArray } = require( 'lodash' );
const { normalizePath } = require( 'typedoc' );

const globAsync = promisify( glob );
module.exports.globAsync = globAsync;

const exec = cmd => new Promise( ( res, rej ) => _exec( cmd, e => e ? rej( e ) : res() ) );
module.exports.exec = exec;

/**
 * @param {string} cmd
 * @param {string[]=} args
 * @param {import('child_process').SpawnOptionsWithoutStdio=} opts
 */
const spawn = ( cmd, args, opts = {} ) => new Promise( ( res, rej ) => {
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
	p.on( 'close', code => code !== 0 ? rej( new Error( `Exit code ${code}: ${JSON.stringify( {
		cmd: [ cmd, ...args ],
		cwd: opts.cwd,
	} )}` ) ) : res() );
} );
module.exports.spawn = spawn;

/**
 * @returns {Writable & {read: () => string}}
 */
const captureStream = () => {
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
	return stream;
};
module.exports.captureStream = captureStream;

/**
 * @typedef {{name: string, path: string}} Project
 */
/**
 * @returns {Project[]}
 */
const getProjects = once( () => {
	const packages = require( '../package.json' ).workspaces
		.map( w => glob.sync( w, { ignore: 'node_modules/**' } ) )
		.flat();
	let names = packages.slice();
	while( names.every( ( n => n[0] === names[0][0] ) ) ){
		names = names.map( n => n.slice( 1 ) );
	}
	return packages
		.map( ( p, i ) => ( {
			path: p,
			name: names[i],
		} ) );
} );
module.exports.getProjects = getProjects;
/**
 * @param {string} label
 */
module.exports.createStash = async label => {
	const message = `REPO SNAPSHOT '${label}'`;
	await spawn( 'git', [ 'stash', 'push', '--all', '--message', message ], { stdio: [ null, null, process.stderr ] } );
	console.log( `Created a stash "${message}"` );
	await spawn( 'git', [ 'stash', 'apply', 'stash@{0}' ] );
};

module.exports.commonPath = ( input, sep = '/' ) => {
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

module.exports.selectProjects = explicitProjects => {
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
module.exports.formatPackages = ( ...packages ) => spawn( formatPackagesBin, [ '--write', ...packages.map( p => normalizePath( p ) ) ] );
/**
 * @param {string[]} packages
 */
module.exports.checkFormatPackages = ( ...packages ) => spawn( formatPackagesBin, [ '--check', ...packages.map( p => normalizePath( p ) ) ] );

/**
 * @param {string[]} filesList
 */
module.exports.getStagedFiles = async ( ...filesList ) => {
	const stagedPatchesOutput = captureStream();
	if( filesList && filesList.length > 0 ){
		filesList.unshift( '--' );
	}
	await spawn( 'git', [ 'diff', '--name-only', '--cached', ...filesList ], { stdio: [ null, stagedPatchesOutput, null ] } );
	return stagedPatchesOutput.read().split( /\r?\n/ ).filter( v => v );
};
