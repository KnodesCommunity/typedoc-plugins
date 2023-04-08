module.exports = {
	entryPoints: [
		'packages/*',
	],
	entryPointStrategy: 'packages',
	skipErrorChecking: true,
	pluginPages: {
		pages: [
			{ moduleRoot: true, name: 'demo', source: 'root-appendix.md', children: [
				{ name: 'Root doc', source: 'root-doc.md', childrenSourceDir: '.', children: [
					{ name: 'Root doc child', source: 'root-doc-child.md', output: 'child.html' },
				] },
			] },
			{ moduleRoot: true, name: 'pkg-a', source: 'readme-extras.md', children: [
				{ name: 'Using pkg-a', source: 'using-pkg-a.md' },
			] },
			{ moduleRoot: true, name: 'pkg-b', children: [
				{ name: 'Using pkg-b', source: 'using-pkg-b.md', children: [
					{ name: 'pkg-b details', source: 'details.md' },
				] },
			] },
		],
		logLevel: 'Verbose',
	},
};
