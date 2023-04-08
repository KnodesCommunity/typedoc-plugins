import { readFile, writeFile } from 'fs/promises';

import _ from 'lodash';
import { parseDocument as parseYamlDocument, stringify as stringifyYaml } from 'yaml';

import { executors } from './utils/executors.mjs';
import { checkPartialWorkflow } from './workflows/check-partial.mjs';

const baseConfig = parseYamlDocument( await readFile( '.circleci/config.yml', 'utf-8' ) );

const TARGET = process.argv[2];

const config = {
	version: baseConfig.get( 'version', false ),
	orbs: _.omit( baseConfig.get( 'orbs' ).toJSON(), 'continuation' ),
	executors: Object.fromEntries( Object.entries( executors ).map( ( [ , executor ] ) => [ executor.name, executor.executor ] ) ),
	jobs: Object.fromEntries( [
		...checkPartialWorkflow.jobs,
	].map( job => [ job.name, job.job ] ) ),
	workflows: {
		[checkPartialWorkflow.name]: checkPartialWorkflow.workflow,
	},
};

console.dir( config, { depth: 6 } );

await writeFile( TARGET, stringifyYaml( config ) );
