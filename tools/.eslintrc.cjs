module.exports = {
	extends: '../.eslintrc',
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 'latest',
	},
	rules: {
		'import/no-extraneous-dependencies': [ 'error', { devDependencies: true } ],
		'no-console': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/require-returns-description': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/no-undefined-types': 'off',
		'jsdoc/valid-types': 'off',
		'jsdoc/require-jsdoc': 'off',
	},
};
