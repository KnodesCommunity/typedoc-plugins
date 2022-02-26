const { resolve } = require( 'path' );

const base = require( '../../jest.config.base' );
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	...base,
	watchPathIgnorePatterns: [
		...( base.watchPathIgnorePatterns ?? [] ),
		resolve( __dirname, '__tests__/integration/mock-fs/.*' ),
	],
};
