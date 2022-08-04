module.exports = {
	entryPoints: [
		'packages/*',
	],
	entryPointStrategy: 'packages',
	pluginPages: {
		pages: [
			{ match: 'README.md', template: [
				// eslint-disable-next-line no-template-curly-in-string -- Lodash templates
				{ moduleRoot: true, source: '${context.fullPath}', name: 'pkg-<%= _.nth(context.from.split("/"), -1) %>' },
			] },
			{ moduleRoot: true, name: 'demo', source: 'pages/root-appendix.md', childrenSourceDir: 'pages', childrenOutputDir: '', children: [
				{ name: 'Root doc', source: 'root-doc.md', childrenSourceDir: '.', children: [
					{ name: 'Root doc child', source: 'root-doc-child.md', output: 'child.html' },
				] },
			] },
			{ moduleRoot: true, name: 'pkg-a', childrenSourceDir: 'pages', children: [
				{ name: 'Using pkg-a', source: 'using-pkg-a.md' },
			] },
			{ moduleRoot: true, name: 'pkg-b', childrenSourceDir: 'pages', children: [
				{ name: 'Using pkg-b', source: 'using-pkg-b.md', children: [
					{ name: 'pkg-b details', source: 'details.md' },
				] },
			] },
		],
		source: null,
		linkModuleBase: 'pages',
		logLevel: 'Verbose',
	},
};
