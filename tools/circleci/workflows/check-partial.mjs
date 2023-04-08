import { buildJob } from '../jobs/build.mjs';
import { checkoutJob } from '../jobs/checkout.mjs';
import { lintJob } from '../jobs/lint.mjs';
import { npmInstallJob } from '../jobs/npm-install.mjs';
import { testSourcesJob } from '../jobs/test-sources.mjs';
import { defaultNodeVersion } from '../utils/node-versions.mjs';
import { allOses, defaultOs } from '../utils/osses.mjs';

export const checkPartialWorkflow = {
	name: 'check-partial',
	run: ( { git: { branch }} ) => !( branch === 'main' || branch === 'develop' || branch.match( /^renovate\/.+$/ ) ),
	jobs: [
		checkoutJob,
		buildJob,
		npmInstallJob,
		lintJob,
		testSourcesJob,
	],
	workflow: {
		jobs: [
			checkoutJob.name,
			{ [npmInstallJob.name]: {
				'matrix': {
					parameters: {
						os: allOses,
					},
				},
				'install-type': 'install',
				'node-version': defaultNodeVersion,
				'requires': [
					checkoutJob.name,
				],
			}},
			{ [buildJob.name]: {
				'os': defaultOs,
				'node-version': defaultNodeVersion,
				'requires': [
					`${npmInstallJob.name}-${defaultOs}`,
				],
			}},
			{ [lintJob.name]: {
				requires: [
					`${npmInstallJob.name}-${defaultOs}`,
				],
			}},
			{ [testSourcesJob.name]: {
				'coverage': true,
				'matrix': {
					parameters: {
						os: allOses,
					},
				},
				'node-version': defaultNodeVersion,
				'requires': [
					`${npmInstallJob.name}-<<matrix.os>>`,
				],
			}},
			// {
			// 	'test-tools': {
			// 		name: 'test-tools-<<matrix.os>>-STUB',
			// 		matrix: {
			// 			parameters: {
			// 				os: 'test-matrix-os',
			// 			},
			// 			exclude: [
			// 				{
			// 					os: 'test-matrix-os-default',
			// 				},
			// 				{
			// 					os: 'windows',
			// 				},
			// 			],
			// 		},
			// 		requires: [
			// 			`${npmInstallJob.name}-<<matrix.os>>`,
			// 		],
			// 	},
			// },
			// {
			// 	'test-tools': {
			// 		name: 'test-tools-${defaultOs}-coverage',
			// 		os: 'test-matrix-os-default',
			// 		coverage: true,
			// 		requires: [
			// 			`${npmInstallJob.name}-${defaultOs}`,
			// 			'build',
			// 		],
			// 	},
			// },
			// {
			// 	'codeclimate-upload': {
			// 		requires: [
			// 			'test-sources-${defaultOs}',
			// 			'test-tools-${defaultOs}-coverage',
			// 		],
			// 	},
			// },
		],
	},
};
