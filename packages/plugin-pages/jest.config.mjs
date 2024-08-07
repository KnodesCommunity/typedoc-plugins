import { fileURLToPath } from 'node:url';

import generateJestProjectConfig from '../../jest.config.base.mjs';

const dirname = fileURLToPath( new URL( '.', import.meta.url ) );
const base = generateJestProjectConfig( dirname );
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
	...base,
	projects: [
		base.projects[0],
		{
			...base.projects[1],
			setupFilesAfterEnv: [ ...base.projects[1].setupFilesAfterEnv, '@testing-library/jest-dom' ],
		},
	],
};
