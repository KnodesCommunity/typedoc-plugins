const assert = require( 'assert' );
const { readFile, writeFile } = require( 'fs/promises' );

const { once } = require( 'lodash' );

const { resolveRoot } = require( '../utils' );

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler}
 */
module.exports.circleCi = async checkOnly => ( {
	run: once( async() => {
		const circleCiPath = resolveRoot( '.circleci/config.yml' );
		const currentCircleCi = await readFile( circleCiPath, 'utf-8' );
		const nvmRc = await readFile( resolveRoot( '.nvmrc' ) );
		const circleCiConfigVersion = `&test-matrix-node-versions-default "${nvmRc}"`;
		if( checkOnly ){
			assert( currentCircleCi.includes( circleCiConfigVersion ), `CircleCI config does not match nvmrc version ${nvmRc}` );
		} else {
			const regex = /&test-matrix-node-versions-default "\S+"/;
			assert( regex.test( currentCircleCi ) );
			const replacedConfig = currentCircleCi.replace( regex, circleCiConfigVersion );
			await writeFile( circleCiPath, replacedConfig );
		}
	} ),
} );
