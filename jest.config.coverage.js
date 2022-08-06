const config = require( './jest.config' );

module.exports = {
	...config,
	// See https://jestjs.io/docs/configuration#coveragereporters-arraystring--string-options
	coverageReporters: [
		[ 'lcov', { projectRoot: __dirname } ],
	],
	collectCoverage: true,
};
