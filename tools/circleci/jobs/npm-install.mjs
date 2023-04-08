export const npmInstallJob = {
	name: 'npm-install',
	job: {
		parameters: {
			'install-type': { type: 'string', default: 'clean-install' },
			'os': { type: 'string' },
			'node-version': { type: 'string' },
		},
		executor: '<<parameters.os>>',
		steps: [
			{ 'node/install': {
				'node-version': '<<parameters.node-version>>',
			}},
			{ attach_workspace: { at: '.' }},
			{ when: {
				condition: { equal: [ 'windows', '<<parameters.os>>' ] },
				steps: [
					{ 'node/install-packages': {
						'override-ci-command': 'npm run ci:<<parameters.install-type>>',
						'cache-path': 'C:\\Users\\circleci\\AppData\\Roaming\\npm-cache',
						'cache-version': 'v1-<<parameters.os>>',
					}},
				],
			}},
			{ unless: {
				condition: { equal: [ 'windows', '<<parameters.os>>' ] },
				steps: [
					{ 'node/install-packages': {
						'override-ci-command': 'npm run ci:<<parameters.install-type>>',
						'cache-version': 'v1-<<parameters.os>>',
					}},
				],
			}},
			{ run: {
				name: 'Update submodule & patch',
				command: 'git submodule update --init --recursive && npm run tools:patch -- apply --no-stash',
			}},
			{ persist_to_workspace: {
				root: '.',
				paths: [
					'.git',
					'typedoc',
					'package-lock.json',
					'node_modules',
					'packages/*/node_modules',
				],
			}},
		],
	},
};
