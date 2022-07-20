const config = require( './jest.config' );

module.exports = {
	...config,
	// See https://jestjs.io/docs/configuration#coveragereporters-arraystring--string-options
	coverageReporters: [
		'lcovonly',
		'json-summary',
		'text',
	],
	// Run in band
	maxWorkers: 1,
};
