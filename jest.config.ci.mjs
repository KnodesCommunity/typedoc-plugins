import { fileURLToPath } from 'node:url';

import config from './jest.config.mjs';


const dirname = fileURLToPath( new URL( '.', import.meta.url ) );
export default {
	...config,
	// See https://jestjs.io/docs/configuration#coveragereporters-arraystring--string-options
	coverageReporters: [
		[ 'lcovonly', { projectRoot: dirname } ],
		'json',
		'json-summary',
		'text',
	],
	// Run in band
	maxWorkers: 1,
};
