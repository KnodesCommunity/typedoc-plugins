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
	/** @type {import('@knodes/typedoc-plugin-pages').IPluginOptions} */
	pluginPages: {
		pages: [
			// Add `pages/readme-extras.md` at the end of the module's readme in every module containing it. Use function template.
			{ loader: 'template', match: 'pages/readme-extras.md', template: context => [
				{ moduleRoot: true, name: `@knodes/typedoc-${basename( context.from )}`, source: context.match },
			] },
			// Add `pages/options.md` page in every module containing it. Use JSON-compatible template.
			{ loader: 'template', match: 'pages/options.md', template: [
				{ moduleRoot: true, name: '@knodes/typedoc-${path.basename(match.from)}', children: [
					{ name: 'Using options', source: '${match.match}' },
				] },
			] },
			// #endregion
			{ loader: 'frontMatter', root: 'pages' },
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
			{ loader: 'template', match: 'CHANGELOG.md', template: context => [
				{ moduleRoot: true, name: context.module.name, children: [
					{ name: 'Changelog', source: context.match },
				] },
			] },
		],
		// #endregion
		excludeMarkdownTags: [ '{@page <path-to-file>[ link label]}', '{@page ...}' ],
		linkModuleBase: 'pages',
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
/* eslint-enable no-template-curly-in-string */
