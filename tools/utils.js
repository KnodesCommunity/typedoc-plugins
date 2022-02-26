const { exec: _exec } = require( 'child_process' );

const glob = require( 'glob' );
const { once } = require( 'lodash' );

module.exports.exec = cmd => new Promise( ( res, rej ) => _exec( cmd, e => e ? rej( e ) : res() ) );
module.exports.getProjects = once( () => require( '../package.json' ).workspaces
	.map( w => glob.sync( w, { ignore: 'node_modules/**' } ) )
	.flat() );


// From https://www.rosettacode.org/wiki/Find_common_directory_path#JavaScript

module.exports.commonPath = ( input, sep = '/' ) => {
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
