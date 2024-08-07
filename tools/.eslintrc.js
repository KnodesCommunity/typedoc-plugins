module.exports = {
	root: true,
	extends: '@knodes/eslint-config/js',
	env: { node: true },
	settings: {
		jsdoc: {
			mode: 'typescript',
		},
	},
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2022,
	},
	rules: {
		'no-console': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/require-returns-description': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/no-undefined-types': 'off',
		'jsdoc/valid-types': 'off',
		'jsdoc/require-jsdoc': 'off',
	},
};
