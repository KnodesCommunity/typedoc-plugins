const { resolve } = require( 'path' );

const base = require( '../../jest.config.base' );
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	...base,
	projects: [
		{
			...base.projects[0],
			setupFilesAfterEnv: [ ...base.projects[1].setupFilesAfterEnv, '@alex_neo/jest-expect-message' ],
		},
		{
			...base.projects[1],
			setupFilesAfterEnv: [ ...base.projects[1].setupFilesAfterEnv, '@testing-library/jest-dom' ],
		},
	],
	watchPathIgnorePatterns: [
		...( base.watchPathIgnorePatterns ?? [] ),
		resolve( __dirname, '__tests__/integration/mock-fs/.*' ),
	],
};
