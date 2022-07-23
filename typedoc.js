// #region pagesConfig-1
module.exports = {
	// #endregion
	out: 'docs',
	// #region pagesConfig-2
	name: 'Knodes TypeDoc Plugins',
	entryPoints: [
		'packages/*',
	],
	entryPointStrategy: 'packages',
	pluginPages: {
		pages: [
			{
				title: 'Knodes TypeDoc Plugins', // The section containing the monorepo root pages
				moduleRoot: true,
				children: [
					{ title: 'Changelog', source: './CHANGELOG.md' },
				],
			},
			{
				title: '@knodes/typedoc-plugin-pages', // A pages section for the package `@knodes/typedoc-plugin-pages`
				moduleRoot: true,
				source: 'readme-extras.md', // This is a module root page. `readme-extras.md` will be appended to the module index
				children: [ // Children pages
					{ title: 'Using options', source: 'options.md' },
					{ title: 'Pages tree', source: 'pages-tree.md' },
				],
			},
			// #endregion
			{
				title: '@knodes/typedoc-plugin-code-blocks',
				moduleRoot: true,
				children: [
					{ title: 'Using options', source: 'options.md' },
					{ title: 'Configuring eslint', source: 'eslint.md' },
				],
			},
			{
				title: '@knodes/typedoc-plugin-monorepo-readmes',
				moduleRoot: true,
				children: [
					{ title: 'Using options', source: 'options.md' },
				],
			},
			{
				title: '@knodes/typedoc-pluginutils',
				moduleRoot: true,
				children: [
					{ title: 'Providing options', source: 'providing-options.md' },
					{ title: 'Resolving paths', source: 'resolving-paths.md' },
				],
			},
			// #region pagesConfig-3
		],
		// #endregion
		excludeMarkdownTags: [ '{@page <path-to-file>[ link label]}', '{@page ...}' ],
		// #region pagesConfig-4
	},
	// #endregion
	pluginCodeBlocks: {
		source: '__tests__/mock-fs',
	},
	excludePrivate: true,
	// #region pagesConfig-5
};
// #endregion
