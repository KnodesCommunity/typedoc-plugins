const { exec: _exec, spawn: _spawn } = require( 'child_process' );
const { Writable, Stream, Readable } = require( 'stream' );
const { promisify } = require( 'util' );

const glob = require( 'glob' );
const { once, isArray } = require( 'lodash' );

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
	if( stdio && isArray( stdio ) ){
		opts.stdio = stdio.map( ( s, i ) => i <= 2 && s instanceof Stream ? 'pipe' : s );
	}
	opts.cwd ??= process.cwd();
	const p = _spawn( cmd, args, opts );
	if( stdio && isArray( stdio ) ){
		stdio[0] instanceof Readable && stdio[0].pipe( p.stdin );
		stdio[1] instanceof Writable && p.stdout.pipe( stdio[1] );
		stdio[2] instanceof Writable && p.stderr.pipe( stdio[2] );
	}
	p.on( 'close', code => code !== 0 ? rej( new Error( `Exit code ${code}` ) ) : res() );
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
module.exports.getProjects = once( () => {
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
/**
 * @param {string} label
 */
module.exports.createStash = async label => {
	const message = `REPO SNAPSHOT '${label}'`;
	await spawn( 'git', [ 'stash', 'push', '--all', '--message', message ], { stdio: [ null, null, process.stderr ] } );
	console.log( `Created a stash "${message}"` );
	await spawn( 'git', [ 'stash', 'apply', 'stash@{0}' ] );
};
