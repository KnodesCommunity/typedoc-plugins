import { readFile } from 'fs/promises';

import { glob } from 'glob';
import { minVersion } from 'semver';

import { postProcessYaml, syncFile } from './utils/index.mjs';
import { resolveRoot } from '../utils.mjs';

const DIR = resolveRoot( './.github/ISSUE_TEMPLATE' );

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils/index.mjs').ProtoHandler}
 */
export const issueTemplate = async checkOnly => ( {
	tearDown: async ( _, projects ) => {
		await Promise.all( ( await glob( '*.yaml', { cwd: DIR } ) ).map( async f => {
			const path = resolveRoot( DIR, f );
			const yaml = await readFile( path, 'utf-8' );
			const yamlFormatted = postProcessYaml( yaml, {
				plugins: projects.filter( p => !p.pkgJson.private ).map( p => p.pkgName ),
				typedocVersion: minVersion( JSON.parse( await readFile( resolveRoot( 'package.json' ), 'utf-8' ) ).peerDependencies.typedoc ),
			} );
			await syncFile( checkOnly, path, yamlFormatted );
		} ) );
	},
} );
