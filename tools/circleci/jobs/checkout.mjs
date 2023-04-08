import { executors } from '../utils/executors.mjs';

export const checkoutJob = {
	name: 'checkout',
	job: {
		executor: executors.git.name,
		resource_class: 'small',
		steps: [
			{ attach_workspace: { at: '.' }},
			'checkout',
			{ persist_to_workspace: {
				root: '.',
				paths: [
					'*',
				],
			}},
		],
	},
};
