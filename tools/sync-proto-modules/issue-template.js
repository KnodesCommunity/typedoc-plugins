const { readFile } = require( 'fs/promises' );

const { minVersion } = require( 'semver' );

const { resolveRoot, globAsync } = require( '../utils' );
const { syncFile, postProcessYaml } = require( './utils' );
const DIR = resolveRoot( './.github/ISSUE_TEMPLATE' );

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler}
 */
module.exports.issueTemplate = async checkOnly => ( {
	tearDown: async ( _, projects ) => {
		await Promise.all( ( await globAsync( '*.yaml', { cwd: DIR } ) ).map( async f => {
			const path = resolveRoot( DIR, f );
			const yaml = await readFile( path, 'utf-8' );
			const yamlFormatted = postProcessYaml( yaml, {
				plugins: projects.filter( p => !p.pkgJson.private ).map( p => p.pkgName ),
				typedocVersion: minVersion( require( resolveRoot( 'package.json' ) ).devDependencies.typedoc ),
			} );
			await syncFile( checkOnly, path, yamlFormatted );
		} ) );
	},
} );
