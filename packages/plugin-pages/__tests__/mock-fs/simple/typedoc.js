/** @type {import('../../../src').IPluginOptions} */
module.exports = {
	entryPoints: [
		'./src/index.ts',
	],
	pluginPages: {
		pages: [
			{ title: 'Getting started', source: 'getting-started.md', children: [
				{ title: 'Configuration', source: 'configuration.md' },
			] },
			{ title: 'Additional resources', childrenDir: 'additional-resources', children: [
				{ title: 'Some cool docs', source: 'some-cool-docs.md' },
			] },
		],
	},
};
