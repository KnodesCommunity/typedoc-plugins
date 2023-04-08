export const buildJob = {
	name: 'build',
	job: {
		parameters: {
			'store_artifacts': { type: 'boolean', default: false },
			'os': { type: 'string' },
			'node-version': { type: 'string' },
		},
		executor: '<<parameters.os>>',
		steps: [
			{ 'node/install': {
				'node-version': '<<parameters.node-version>>',
			}},
			{ attach_workspace: {
				at: '.',
			}},
			{ run: `npm run build
mkdir dists
npm pack -ws --pack-destination dists
for file in $(find ./dists -name '*.tgz'); do
    mkdir -p dists-content/$(basename $file .tgz)
    tar -xzf $file -C dists-content/$(basename $file .tgz)
done` },
			{ when: {
				condition: '<<parameters.store_artifacts>>',
				steps: [
					{
						store_artifacts: {
							path: './dists',
						},
					},
					{
						store_artifacts: {
							path: './dists-content',
						},
					},
				],
			}},
			{ persist_to_workspace: {
				root: '.',
				paths: [
					'./packages/**',
				],
			}},
		],
	},
};
