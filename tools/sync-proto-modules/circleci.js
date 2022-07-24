const { readFile } = require( 'fs/promises' );

const { resolveRoot } = require( '../utils' );
const { syncFile, postProcessYaml } = require( './utils' );

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler}
 */
module.exports.circleCi = async checkOnly => ( {
	tearDown: async() => {
		const circleCiPath = resolveRoot( '.circleci/config.yml' );
		const currentCircleCi = await readFile( circleCiPath, 'utf-8' );
		const nvmRc = await readFile( resolveRoot( '.nvmrc' ) );

		const cfgNvmSet = currentCircleCi.replace( /&test-matrix-node-versions-default "\S+"/, `&test-matrix-node-versions-default "${nvmRc}"` );

		const cfgFormatted = postProcessYaml( cfgNvmSet );
		await syncFile( checkOnly, circleCiPath, cfgFormatted );
	},
} );
