// #region config-1
module.exports = {
	// #endregion config-1
	entryPoints: [
		'./src/index.ts',
	],
	skipErrorChecking: true,
	/** @type {import('../../../src').IPluginOptions} */
	// #region config-2
	pluginPages: {
		pages: [
			{ name: 'VIRTUAL', childrenDir: 'pages', children: [
				{ name: 'Getting started', source: 'getting-started.md', children: [
					{ name: 'Configuration', source: 'configuration.md' },
					{ name: 'Another page', source: 'other.md' },
				] },
				{ name: 'Additional resources', childrenDir: 'additional-resources', children: [
					{ name: 'Some cool docs', source: 'some-cool-docs.md' },
				] },
			] },
			// #endregion config-2
			{ loader: 'frontMatter', root: 'pagesFront' },
			// #region config-3
		],
	},
};
// #endregion config-3
