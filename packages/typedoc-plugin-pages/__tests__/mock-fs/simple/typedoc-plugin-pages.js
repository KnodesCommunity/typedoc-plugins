/** @type {import('../../../src').IPluginOptions} */
module.exports = {
	pages: [
		{ title: 'Foo', source: 'foo.md', children: [
			{ title: 'Bar', source: 'bar.md' },
		] },
		{ title: 'Qux', childrenDir: 'qux', children: [
			{ title: 'Baaz', source: 'baaz.md' },
		] },
	],
};
