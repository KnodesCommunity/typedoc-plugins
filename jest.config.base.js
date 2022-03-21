const { resolve } = require( 'path' );

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const baseConfig = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	globals: {
		'ts-jest': {
			tsconfig: '<rootDir>/tsconfig.spec.json',
		},
	},
	moduleNameMapper: {
		'^#plugintestbed$': resolve( __dirname, './packages/plugintestbed' ),
	},
	setupFilesAfterEnv: [ 'jest-extended/all' ],
	watchPathIgnorePatterns: [ '<rootDir>/__tests__/mock-fs/' ],
};
const anyExt = '.{c,m,}{t,j}s{x,}';
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest[]} */
module.exports = {
	anyExt,
	projects: [
		{
			...baseConfig,
			displayName: {
				name: 'unit',
				color: 'blue',
			},
			testMatch: [ `<rootDir>/src/**/*.spec${anyExt}` ],
		},
		{
			...baseConfig,
			displayName: {
				name: 'integration',
				color: 'green',
			},
			testMatch: [ `<rootDir>/__tests__/integration/**/*.spec${anyExt}` ],
		},
	],
	collectCoverageFrom: [
		'src/**',
		`!**/*.spec${anyExt}`,
	],
};
