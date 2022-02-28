module.exports = {
	root: true,
	extends: [ '@knodes/eslint-config/ts' ],
	env: { node: true },
	parserOptions: {
		project: [ `${__dirname}/tsconfig.json`, `${__dirname}/tsconfig.spec.json` ],
	},
};
