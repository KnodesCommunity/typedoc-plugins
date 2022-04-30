module.exports = {
	name: 'Knodes TypeDoc Plugins',
	out: 'docs',
	entryPoints: [
		'packages/*',
	],
	entryPointStrategy: 'packages',
	pluginPages: {
		pages: [
			{ title: 'VIRTUAL', childrenDir: '../', children: [
				{ title: 'Changelog', source: 'CHANGELOG.md' },
			] },
			{ title: '@knodes/typedoc-plugin-code-blocks', source: 'readme-extras.md', children: [
				{ title: 'Using options', source: 'options.md' },
			] },
			{ title: '@knodes/typedoc-plugin-monorepo-readmes', children: [
				{ title: 'Using options', source: 'options.md' },
			] },
			{ title: '@knodes/typedoc-plugin-pages', source: 'readme-extras.md', children: [
				{ title: 'Using options', source: 'options.md' },
				{ title: 'Pages tree', source: 'pages-tree.md' },
			] },
			{ title: '@knodes/typedoc-pluginutils', children: [
				{ title: 'Providing options', source: 'providing-options.md' },
			] },
		],
	},
	pluginCodeBlocks: {
		source: '__tests__/mock-fs',
	},
	excludePrivate: true,
};
