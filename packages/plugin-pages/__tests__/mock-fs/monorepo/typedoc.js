module.exports = {
	entryPoints: [
		'packages/*',
	],
	entryPointStrategy: 'packages',
	pluginPages: {
		pages: [
			{ title: 'Root doc', source: 'root-doc.md' },
			{ title: 'pkg-a', source: 'readme-extras.md', children: [
				{ title: 'Using pkg-a', source: 'using-pkg-a.md' },
			] },
			{ title: 'pkg-b', children: [
				{ title: 'Using pkg-b', source: 'using-pkg-b.md' },
			] },
		],
	},
};
