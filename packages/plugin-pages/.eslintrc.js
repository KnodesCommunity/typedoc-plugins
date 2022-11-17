module.exports = {
	root: true,
	extends: [ require( 'path' ).resolve( __dirname, '../pluginutils/.eslintrc.js' ) ],
	env: { node: true },
	parserOptions: {
		project: [ `${__dirname}/tsconfig.build.json`, `${__dirname}/tsconfig.spec.json` ],
	},
	rules: {
		'no-bitwise': [ 'off' ],
		'jsdoc/check-tag-names': [ 'error', { definedTags: [ 'experimental', 'category' ] } ],
	},
};
