const assert = require( 'assert' );

const { spawn, captureStream, resolveRoot } = require( '../utils' );

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler}
 */
module.exports.typedocSubmodule = async checkOnly => ( {
	tearDown: async () => {
		const typedocDir = resolveRoot( 'typedoc' );
		const packageTypedoc = require( '../../package.json' ).devDependencies.typedoc.replace( /^\D*/, '' );
		const submoduleTypedoc = ( await spawn(
			'git',
			[ '-C', typedocDir, 'describe', '--tags' ],
			{ stdio: [ null, captureStream(), captureStream() ] } ) )
			.stdout.trim().replace( /^v/, '' );
		if( checkOnly ){
			assert.equal( packageTypedoc, submoduleTypedoc, `The packages typedoc version ${packageTypedoc} does not match the submodule typedoc version ${submoduleTypedoc}` );
		} else if( packageTypedoc !== submoduleTypedoc ){
			console.log( 'Moving typedoc to the expected tag' );
			await spawn(
				'git',
				[ '-C', typedocDir, 'fetch', '--tags' ] );
			await spawn(
				'git',
				[ '-C', typedocDir, 'switch', `tags/v${packageTypedoc}`, '--detach' ] );
		}
	},
} );
