/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const baseConfig = {
	preset: 'ts-jest',
	testEnvironment: 'node',
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
			collectCoverage: false,
			testMatch: [ '<rootDir>/__tests__/integration/**/*.spec.ts' ],
		},
	],
};
