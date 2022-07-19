module.exports = {
	root: true,
	extends: [ '@knodes/eslint-config/ts' ],
	env: { node: true },
	parserOptions: {
		project: [ `${__dirname}/tsconfig.build.json`, `${__dirname}/tsconfig.spec.json` ],
	},
	// #region jsdoc-config
	rules: {
		'jsdoc/check-tag-names': [ 'error', { definedTags: [ 'codeblock', 'inlineCodeblock' ] } ],
	},
	// #endregion
};
