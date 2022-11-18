module.exports = {
	root: true,
	extends: [ '@knodes/eslint-config/ts' ],
	env: { node: true },
	parserOptions: {
		project: [ `${__dirname}/tsconfig.build.json`, `${__dirname}/tsconfig.spec.json` ],
	},
	rules: {
		'no-restricted-imports': [ 'error', 'path' ],
	},
	settings: {
		jsdoc: {
			mode: 'typescript',
		},
	},
};
