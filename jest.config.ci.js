const config = require( './jest.config' );

module.exports = {
	...config,
	// See https://jestjs.io/docs/configuration#coveragereporters-arraystring--string-options
	coverageReporters: [
		'clover',
		'json',
		[ 'lcov', { projectRoot: __dirname } ],
		'text',
	],
	// Run in band
	maxWorkers: 1,
};
