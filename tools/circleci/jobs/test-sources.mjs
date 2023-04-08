import { defaultNodeVersion } from '../utils/node-versions.mjs';
import { defaultOs } from '../utils/osses.mjs';

export const testSourcesJob = {
	name: 'test-sources',
	job: {
		parameters: {
			'os': { type: 'string' },
			'node-version': { type: 'string' },
			'coverage': { type: 'boolean', default: false },
		},
		executor: '<<parameters.os>>',
		parallelism: 4,
		steps: [
			{ 'node/install': { 'node-version': '<<parameters.node-version>>' }},
			{ attach_workspace: { at: '.' }},
			{ run: {
				name: 'Split tests',
				command: `set -eo pipefail
				circleci tests glob "./packages/**/*.spec.ts" | circleci tests split --split-by=timings > TEST_FILES
				if ! [ -z $HOMEDRIVE ]; then
				sed -i 's:\\\\\\:/:g' TEST_FILES
				fi
				echo "Will be ran on following files:$(cat TEST_FILES)"`,
			}},
			{ when: {
				condition: {
					and: [
						'<<parameters.coverage>>',
						{ equal: [ '<<parameters.os>>', defaultOs ] },
						{ equal: [ '<<parameters.node-version>>', defaultNodeVersion ] },
					],
				},
				steps: [
					{ run: `set -eo pipefail
					npm run ci:test:coverage -- $(cat TEST_FILES)
					echo $? > EXIT_CODE` },
					{ when: {
						condition: { equal: [ '<<parameters.os>>', 'windows' ] },
						steps: [
							{ run: {
								name: 'Normalize windows report',
								command: `set -eo pipefail
								for file in "coverage/coverage-summary.json" "coverage/coverage-final.json"; do
									cat $file |
										sed 's|C:\\\\Users\\\\circleci\\\\project|/home/circleci/project|g' |
											sed 's|\\\\|/|g' > $file
								done`,
							}},
						],
					}},
					{ run: {
						name: 'Move files to use buildId test-sources-${CIRCLE_NODE_INDEX}',
						command: `set -eo pipefail
						mv EXIT_CODE coverage/EXIT_CODE_test-sources-\${CIRCLE_NODE_INDEX}
						mv coverage/coverage-summary.json coverage/coverage-summary-test-sources-\${CIRCLE_NODE_INDEX}.json
						mv coverage/coverage-final.json coverage/coverage-part-test-sources-\${CIRCLE_NODE_INDEX}.json`,
					}},
					{ persist_to_workspace: {
						root: '.',
						paths: [
							'coverage/coverage-part-*.json',
							'coverage/EXIT_CODE_*',
						],
					}},
					{ store_artifacts: {
						path: 'coverage',
					}},
				],
			}},
			{ unless: {
				condition: {
					and: [
						'<<parameters.coverage>>',
						{ equal: [ '<<parameters.os>>', defaultOs ] },
						{ equal: [ '<<parameters.node-version>>', defaultNodeVersion ] },
					],
				},
				steps: [
					{ run: 'npm run ci:test -- -- $(cat TEST_FILES)' },
				],
			}},
			{ store_test_results: {
				path: './junit.xml',
			}},
		],
	},
};
