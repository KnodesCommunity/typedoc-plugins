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
			{ loader: 'template', match: 'README.md', modules: [ '!~' ], template: [
				{ moduleRoot: true, source: '<%= match.match %>', name: '<%= match.module.name %>' },
			] },
			{ moduleRoot: true, name: 'demo', childrenDir: 'pages', source: 'pages/root-appendix.md', children: [
				{ name: 'Root doc', childrenDir: '.', source: 'root-doc.md', children: [
					{ name: 'Root doc child', source: 'root-doc-child.md' },
				] },
			] },
			{ moduleRoot: true, name: 'pkg-a', childrenDir: 'pages', source: 'pages/readme-extras.md', children: [
				{ name: 'Using pkg-a', source: 'using-pkg-a.md' },
			] },
			{ moduleRoot: true, name: 'pkg-b', childrenDir: 'pages', source: 'pages/readme-extras.md', children: [
				{ name: 'Using pkg-b', source: 'using-pkg-b.md', children: [
					{ name: 'pkg-b details', source: 'details.md' },
				] },
			] },
		],
		linkModuleBase: 'pages',
		diagnostics: '.debug'
	},
};
