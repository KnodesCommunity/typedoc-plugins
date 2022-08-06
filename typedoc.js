/* eslint-disable no-template-curly-in-string -- Use lodash template */
const { basename } = require( 'path' );

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
			{ match: 'pages/readme-extras.md', template: context => [ // Add `pages/readme-extras.md` at the end of the module's readme in every module containing it. Use function template.
				{ moduleRoot: true, name: `@knodes/typedoc-${basename( context.from )}`, source: context.match },
			] },
			{ match: 'pages/options.md', template: [ // Add `pages/options.md` page in every module containing it. Use JSON-compatible template.
				{ moduleRoot: true, name: '@knodes/typedoc-${path.basename(match.from)}', children: [
					{ name: 'Using options', source: '${match.match}' },
				] },
			] },
			{
				name: '@knodes/typedoc-plugin-pages', // A pages section for the package `@knodes/typedoc-plugin-pages`
				moduleRoot: true,
				childrenDir: 'pages',
				children: [ // Children pages
					{ name: 'Pages tree', source: 'pages-tree.md' },
				],
			},
			// #endregion
			{
				name: '@knodes/typedoc-plugin-code-blocks',
				moduleRoot: true,
				childrenDir: 'pages',
				children: [
					{ name: 'Configuring eslint', source: 'eslint.md' },
				],
			},
			{
				name: '@knodes/typedoc-pluginutils',
				moduleRoot: true,
				childrenDir: 'pages',
				children: [
					{ name: 'Providing options', source: 'providing-options.md' },
					{ name: 'Resolving paths', source: 'resolving-paths.md' },
				],
			},
			// #region pagesConfig-3
			{ match: 'CHANGELOG.md', template: [
				{ moduleRoot: true, name: '@knodes/typedoc-${path.basename(match.from)}', children: [
					{ name: 'Changelog', source: '${match.match}' },
				] },
			] },
		],
		// #endregion
		excludeMarkdownTags: [ '{@page <path-to-file>[ link label]}', '{@page ...}' ],
		source: null,
		linkModuleBase: 'pages',
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
/* eslint-enable no-template-curly-in-string */
