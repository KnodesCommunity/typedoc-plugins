import { executors } from '../utils/executors.mjs';

export const lintJob = {
	name: 'lint',
	job: {
		executor: executors.node.name,
		resource_class: 'small',
		environment: { NODE_OPTIONS: '--max-old-space-size=2048' },
		steps: [
			{ attach_workspace: { at: '.' }},
			{ run: 'npm run lint' },
			{ run: 'npm run lint:md' },
		],
	},
};
