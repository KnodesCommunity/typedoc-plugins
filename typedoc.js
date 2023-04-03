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
				name: 'Knodes TypeDoc Plugins', // The section containing the monorepo root pages
				moduleRoot: true,
				children: [
					{ name: 'Changelog', source: './CHANGELOG.md' },
				],
			},
			{
				name: '@knodes/typedoc-plugin-pages', // A pages section for the package `@knodes/typedoc-plugin-pages`
				moduleRoot: true,
				source: 'readme-extras.md', // This is a module root page. `readme-extras.md` will be appended to the module index
				children: [ // Children pages
					{ name: 'Using options', source: 'options.md' },
					{ name: 'Pages tree', source: 'pages-tree.md' },
				],
			},
			// #endregion
			{
				name: '@knodes/typedoc-plugin-code-blocks',
				moduleRoot: true,
				children: [
					{ name: 'Using options', source: 'options.md' },
					{ name: 'Configuring eslint', source: 'eslint.md' },
				],
			},
			{
				name: '@knodes/typedoc-plugin-monorepo-readmes',
				moduleRoot: true,
				children: [
					{ name: 'Using options', source: 'options.md' },
				],
			},
			{
				name: '@knodes/typedoc-pluginutils',
				moduleRoot: true,
				children: [
					{ name: 'Providing options', source: 'providing-options.md' },
					{ name: 'Resolving paths', source: 'resolving-paths.md' },
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
		excludeMarkdownTags: [ '{@codeblock}', '{@inlineCodeblock}' ],
	},
	excludePrivate: true,
	// #region pagesConfig-5
};
// #endregion
