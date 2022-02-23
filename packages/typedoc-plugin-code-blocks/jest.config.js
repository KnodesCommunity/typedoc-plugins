/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const baseConfig = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	collectCoverageFrom: [
		'<rootDir>/src/**/*.{c,m,}{t,j}s',
	],
};
module.exports = {
	projects: [
		{
			...baseConfig,
			displayName: {
				name: 'unit',
				color: 'blue',
			},
			testMatch: [ '<rootDir>/src/**/*.spec.ts' ],
		},
		{
			...baseConfig,
			displayName: {
				name: 'integration',
				color: 'green',
			},
			testMatch: [ '<rootDir>/__tests__/integration/**/*.spec.ts' ],
		},
	],
};