const { relative } = require( 'path' );

const { escapeRegExp } = require( 'lodash' );

const { resolveRoot } = require( './tools/utils' );

/**
 * @param package - Package name
 * @returns {import('ts-jest/dist/types').InitialOptionsTsJest} - Opts.
 */
const baseConfig = package => ( {
	preset: 'ts-jest',
	testEnvironment: 'node',
	globals: {
		'ts-jest': {
			tsconfig: resolveRoot( 'packages', package, 'tsconfig.spec.json' ),
			diagnostics: {
				pathRegex: new RegExp( `^${escapeRegExp( __dirname )}/packages/${package}/.*` ),
			},
		},
	},
	moduleNameMapper: {
		'^@knodes/typedoc-(plugin.*)$': resolveRoot( __dirname, './packages/$1/src' ),
		'^#plugintestbed$': resolveRoot( './packages/plugintestbed/src' ),
	},
	setupFilesAfterEnv: [ 'jest-extended/all' ],
	watchPathIgnorePatterns: [ '__tests__/mock-fs/.*/docs' ],
	modulePathIgnorePatterns: [ '__tests__/mock-fs/.*/' ],
} );
const anyExt = '.{c,m,}{t,j}s{x,}';
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest[]} */
module.exports = projectDir => {
	const package = relative( resolveRoot( 'packages' ), projectDir );
	const base = baseConfig( package );
	return {
		rootDir: resolveRoot( 'packages', package ),
		projects: [
			{
				...base,
				displayName: {
					name: 'unit',
					color: 'blue',
				},
				testMatch: [ resolveRoot( 'packages', package, `src/**/*.spec${anyExt}` ) ],
			},
			{
				...base,
				displayName: {
					name: 'integration',
					color: 'green',
				},
				testMatch: [ resolveRoot( 'packages', package, `__tests__/integration/**/*.spec${anyExt}` ) ],
			},
		],
		collectCoverageFrom: [
			'packages/*/src/**',
			`!**/*.spec${anyExt}`,
		],
	};
};
module.exports.anyExt = anyExt;
