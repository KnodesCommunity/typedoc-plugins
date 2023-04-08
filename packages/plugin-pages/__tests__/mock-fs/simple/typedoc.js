/** @type {import('../../../src').IPluginOptions} */
module.exports = {
	entryPoints: [
		'./src/index.ts',
	],
	skipErrorChecking: true,
	pluginPages: {
		pages: [
			{ name: 'Getting started', source: 'getting-started.md', children: [
				{ name: 'Configuration', source: 'configuration.md' },
				{ name: 'Another page', source: 'other.md' },
			] },
			{ name: 'Additional resources', childrenDir: 'additional-resources', children: [
				{ name: 'Some cool docs', source: 'some-cool-docs.md' },
			] },
		],
	},
};
