/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const baseConfig = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	collectCoverageFrom: [
		'<rootDir>/src/**/*.{c,m,}{t,j}s{x,}',
	],
	coveragePathIgnorePatterns: [
		'<rootDir>/__tests__',
	],
	globals: {
		'ts-jest': {
			tsconfig: '<rootDir>/tsconfig.spec.json',
		},
	},
	setupFilesAfterEnv: [ 'jest-extended/all' ],
};
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest[]} */
module.exports = {
	projects: [
		{
			...baseConfig,
			displayName: {
				name: 'unit',
				color: 'blue',
			},
			testMatch: [ '<rootDir>/src/**/*.spec.{c,m,}{t,j}s{x,}' ],
		},
		{
			...baseConfig,
			displayName: {
				name: 'integration',
				color: 'green',
			},
			testMatch: [ '<rootDir>/__tests__/integration/**/*.spec.{c,m,}{t,j}s{x,}' ],
		},
	],
};
