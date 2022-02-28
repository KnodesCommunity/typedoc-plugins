module.exports = {
	root: true,
	extends: [ '@knodes/eslint-config/ts' ],
	env: { node: true },
	parserOptions: {
		project: [ `${__dirname}/typedoc/tsconfig.json` ],
	},
	settings: {
		jsdoc: {
			mode: 'typescript',
		},
	},
	rules: [['import']]
		.map(([rulePrefix, modulePath]) => Object.keys(require(modulePath ?? `eslint-plugin-${rulePrefix}`).rules)
			.map(rule => `${rulePrefix}/${rule}`))
		.flat(1)
		.reduce((acc, rule) => ({
			...acc,
			[rule]: 'off'
		}), {})
};
