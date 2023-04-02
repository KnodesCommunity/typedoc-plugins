module.exports = {
	root: true,
	extends: [ '@knodes/eslint-config/ts' ],
	env: { node: true },
	parserOptions: {
		project: [ `${__dirname}/tsconfig.build.json`, `${__dirname}/tsconfig.spec.json` ],
	},
	rules: {
		'no-bitwise': [ 'off' ],
		'no-restricted-imports': [ 'error', 'path', 'path/windows', 'path/posix' ], // Use `@knodes/typedoc-pluginutils/path`
	},
	settings: {
		jsdoc: {
			mode: 'typescript',
		},
	},
};
