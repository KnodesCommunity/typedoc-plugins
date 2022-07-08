module.exports = {
	entryPoints: [
		'packages/*',
	],
	entryPointStrategy: 'packages',
	pluginPages: {
		pages: [
			{ moduleRoot: true, title: 'demo', source: 'root-appendix.md' },
			{ title: 'Root doc', source: 'root-doc.md' },
			{ moduleRoot: true, title: 'pkg-a', source: 'readme-extras.md', childrenDir: '', children: [
				{ title: 'Using pkg-a', source: 'using-pkg-a.md' },
			] },
			{ moduleRoot: true, title: 'pkg-b', children: [
				{ title: 'Using pkg-b', source: 'using-pkg-b.md', children: [
					{ title: 'pkg-b details', source: 'details.md' },
				] },
			] },
		],
		logLevel: 'Verbose',
	},
};
