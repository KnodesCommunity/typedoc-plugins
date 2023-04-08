module.exports = {
	entryPoints: [
		'packages/*',
	],
	entryPointStrategy: 'packages',
	skipErrorChecking: true,
	/** @type {import('../../../src/options').IPluginOptions} */
	pluginPages: {
		pages: [
			{ loader: 'frontMatter', root: 'pages-front-matter' },
			{ loader: 'frontMatter', root: 'pages-noop' },
			{ loader: 'template', match: 'pages/readme-extras.md', template: [
				{ moduleRoot: true, source: '<%= match.match %>', name: '<%= match.module.name %>' },
			] },
			{ moduleRoot: true, name: 'demo', childrenDir: 'pages', children: [
				{ name: 'Root doc', childrenDir: '.', source: 'root-doc.md', children: [
					{ name: 'Root doc child', source: 'root-doc-child.md' },
				] },
			] },
			{ moduleRoot: true, name: 'pkg-a', childrenDir: 'pages', children: [
				{ name: 'Using pkg-a', source: 'using-pkg-a.md' },
			] },
			{ moduleRoot: true, name: 'pkg-b', childrenDir: 'pages', children: [
				{ name: 'Using pkg-b', source: 'using-pkg-b.md', children: [
					{ name: 'pkg-b details', source: 'details.md' },
				] },
			] },
		],
		linkModuleBase: 'pages',
	},
};
