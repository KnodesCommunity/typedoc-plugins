module.exports = {
	root: true,
	extends: [ require( 'path' ).resolve( __dirname, '../../packages/pluginutils/.eslintrc.js' ) ],
	env: { node: true },
	parserOptions: {
		project: [ `${__dirname}/tsconfig.build.json`, `${__dirname}/tsconfig.spec.json` ],
	},
	// #region jsdoc-config
	rules: {
		'jsdoc/check-tag-names': [ 'error', { definedTags: [ 'codeblock', 'inlineCodeblock' ] } ],
	},
	// #endregion
	overrides: [
		{
			files: [ '**/*.mjs' ],
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 2022,
			},
		},
	],
};
