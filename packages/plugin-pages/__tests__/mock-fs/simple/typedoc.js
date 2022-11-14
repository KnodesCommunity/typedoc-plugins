module.exports = {
	entryPoints: [
		'./src/index.ts',
	],
	/** @type {import('../../../src').IPluginOptions} */
	pluginPages: {
		pages: [
			{ name: 'VIRTUAL', childrenDir: 'pages', children: [
				{ name: 'Getting started', source: 'getting-started.md', children: [
					{ name: 'Configuration', source: 'configuration.md' },
				] },
				{ name: 'Additional resources', childrenDir: 'additional-resources', children: [
					{ name: 'Some cool docs', source: 'some-cool-docs.md' },
				] },
			] },
			{ loader: 'frontMatter', root: 'pagesFront' },
		],
	},
};
