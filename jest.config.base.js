const { resolve, relative } = require( 'path' );

/**
 * @param package - Package name
 * @returns {import('ts-jest/dist/types').InitialOptionsTsJest} - Opts.
 */
const baseConfig = package => ( {
	preset: 'ts-jest',
	testEnvironment: 'node',
	globals: {
		'ts-jest': {
			tsconfig: `<rootDir>/packages/${package}/tsconfig.spec.json`,
		},
	},
	moduleNameMapper: {
		'^@knodes/typedoc-(plugin.*)$': resolve( __dirname, './packages/$1/src' ),
		'^#plugintestbed$': resolve( __dirname, './packages/plugintestbed/src' ),
	},
	setupFilesAfterEnv: [ 'jest-extended/all' ],
	watchPathIgnorePatterns: [ '<rootDir>/.*/__tests__/mock-fs/.*/docs' ],
	modulePathIgnorePatterns: [ '<rootDir>/.*/__tests__/mock-fs/.*/' ],
} );
const anyExt = '.{c,m,}{t,j}s{x,}';
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest[]} */
module.exports = projectDir => {
	const package = relative( resolve( __dirname, 'packages' ), projectDir );
	const base = baseConfig( package );
	return {
		rootDir: resolve( __dirname, 'packages', package ),
		projects: [
			{
				...base,
				displayName: {
					name: 'unit',
					color: 'blue',
				},
				testMatch: [ `<rootDir>/packages/${package}/src/**/*.spec${anyExt}` ],
			},
			{
				...base,
				displayName: {
					name: 'integration',
					color: 'green',
				},
				testMatch: [ `<rootDir>/packages/${package}/__tests__/integration/**/*.spec${anyExt}` ],
			},
		],
		collectCoverageFrom: [
			'packages/*/src/**',
			`!**/*.spec${anyExt}`,
		],
	};
};
module.exports.anyExt = anyExt;
