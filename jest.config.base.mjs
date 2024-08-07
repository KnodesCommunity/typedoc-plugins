import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveRoot } from './tools/utils.mjs';

const dirname = fileURLToPath( new URL( '.', import.meta.url ) );

/**
 * @param pkg - Package name
 * @returns {import('ts-jest/dist/types').InitialOptionsTsJest} - Opts.
 */
const baseConfig = pkg => ( {
	preset: 'ts-jest',
	testEnvironment: 'node',
	transform: {
		'.*\\.tsx?': [ 'ts-jest', {
			tsconfig: resolveRoot( 'packages', pkg, 'tsconfig.spec.json' ),
			diagnostics: {
				pathRegex: new RegExp( `^${dirname.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' )}/packages/${pkg}/.*` ),
			},
		} ],
	},
	moduleNameMapper: {
		'^@knodes/typedoc-pluginutils/(.*)$': resolveRoot( dirname, './packages/pluginutils/src/utils/$1' ),
		'^@knodes/typedoc-(plugin.*)$': resolveRoot( dirname, './packages/$1/src' ),
		'^#plugintestbed$': resolveRoot( './packages/plugintestbed/src' ),
	},
	setupFilesAfterEnv: [ 'jest-extended/all' ],
	watchPathIgnorePatterns: [ '__tests__/mock-fs/.*/docs' ],
	modulePathIgnorePatterns: [ '__tests__/mock-fs/.*/' ],
} );
export const anyExt = '.{c,m,}{t,j}s{x,}';
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest[]} */
const generateJestProjectConfig = projectDir => {
	const pkg = relative( resolveRoot( 'packages' ), projectDir );
	const base = baseConfig( pkg );
	return {
		rootDir: resolveRoot( 'packages', pkg ),
		projects: [
			{
				...base,
				displayName: {
					name: 'unit',
					color: 'blue',
				},
				testMatch: [ resolveRoot( 'packages', pkg, `src/**/*.spec${anyExt}` ) ],
			},
			{
				...base,
				displayName: {
					name: 'integration',
					color: 'green',
				},
				testMatch: [ resolveRoot( 'packages', pkg, `__tests__/integration/**/*.spec${anyExt}` ) ],
			},
		],
		collectCoverageFrom: [
			'packages/*/src/**',
			`!**/*.spec${anyExt}`,
		],
	};
};
export default generateJestProjectConfig;
