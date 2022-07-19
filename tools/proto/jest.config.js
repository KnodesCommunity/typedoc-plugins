const base = require( '../../jest.config.base' );
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	...base,
	projects: [
		base.projects[0],
		{
			...base.projects[1],
			setupFilesAfterEnv: [ ...base.projects[1].setupFilesAfterEnv, '@testing-library/jest-dom' ],
		},
	],
};
