import { fileURLToPath } from 'node:url';

import config from './jest.config.mjs';

const dirname = fileURLToPath( new URL( '.', import.meta.url ) );

export default {
	...config,
	// See https://jestjs.io/docs/configuration#coveragereporters-arraystring--string-options
	coverageReporters: [
		[ 'lcov', { projectRoot: dirname } ],
	],
	collectCoverage: true,
};
