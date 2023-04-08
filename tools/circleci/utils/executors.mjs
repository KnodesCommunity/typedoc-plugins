export const executors = {
	node: {
		name: 'node',
		executor: { docker: [
			{ image: 'cimg/node:lts' },
		] },
	},
	linux: {
		name: 'linux',
		executor: {
			machine: { image: 'ubuntu-2004:202107-02' },
			resource_class: 'medium',
		},
	},
	macos: {
		name: 'macos',
		executor: {
			macos: { xcode: '14.2.0' },
			resource_class: 'macos.x86.medium.gen2',
		},
	},
	windows: {
		name: 'windows',
		executor: {
			machine: {
				image: 'windows-server-2019-vs2019:stable',
				shell: 'bash.exe',
			},
			resource_class: 'windows.medium',
		},
	},
	default: {
		name: 'default',
		executor: { docker: [
			{ image: 'cimg/base:stable' },
		] },
	},
	git: {
		name: 'git',
		executor: { docker: [
			{ image: 'alpine/git' },
		] },
	},
};
