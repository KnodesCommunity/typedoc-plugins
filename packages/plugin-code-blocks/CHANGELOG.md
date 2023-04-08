## [0.23.4](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.23.3...v0.23.4) (2023-04-08)


No notable changes were done in this version.


## [0.23.4-next.0](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.23.3...v0.23.4-next.0) (2023-04-08)


### Bug Fixes

* **dep: @knodes/typedoc-pluginutils:** don't use `.at`, incompatible with node<18 ([b15ab2d](https://github.com/KnodesCommunity/typedoc-plugins/commit/b15ab2d91b677e2894a3a1ee9b51d7e9044c596c))


### Features

* **monorepo:** rework pretty much everything ([c05cda5](https://github.com/KnodesCommunity/typedoc-plugins/commit/c05cda58af59647fb0cac8fd7d6634fe48e42851))


## [0.23.3](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.23.2...v0.23.3) (2023-04-08)


### Bug Fixes

* **deps:** update dependency memfs to v3.4.13 ([#310](https://github.com/KnodesCommunity/typedoc-plugins/issues/310)) ([5379faf](https://github.com/KnodesCommunity/typedoc-plugins/commit/5379faf293223f1e85de8793dbb7c3f62e25e8ad))
* fix region interpolation incorrectly parsed ([#304](https://github.com/KnodesCommunity/typedoc-plugins/issues/304)) ([3e9cae3](https://github.com/KnodesCommunity/typedoc-plugins/commit/3e9cae320028b86c2a12bfd60feb94bf313d8ed9)), closes [#291](https://github.com/KnodesCommunity/typedoc-plugins/issues/291)
* **tools:** adapt to glob now being promised instead of callback ([1c48303](https://github.com/KnodesCommunity/typedoc-plugins/commit/1c4830384b90b3288bc0f82972640db0de61f3dd))
* **tools:** checkout correct branch for docs update ([f6e05ba](https://github.com/KnodesCommunity/typedoc-plugins/commit/f6e05ba8a0f81e4ef41195c14601574c74db9925))


## [0.23.2](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.23.1...v0.23.2) (2023-04-05)


### Bug Fixes

* **monorepo:** always use normalized paths ([b2dc4ff](https://github.com/KnodesCommunity/typedoc-plugins/commit/b2dc4ff053481795e09b86b21a5371ee17dc6008))
* **deps:** update dependencies ([413ae46](https://github.com/KnodesCommunity/typedoc-plugins/commit/413ae469d67d2c242bf8eb0b226b19c04f8b4472))
* **deps:** update dependency memfs to v3.4.10 ([27a52ef](https://github.com/KnodesCommunity/typedoc-plugins/commit/27a52efb9b1eafade2de6ccac46fb41a26f7b5da))
* **deps:** update dependency semver to v7.3.8 ([c14eae1](https://github.com/KnodesCommunity/typedoc-plugins/commit/c14eae17d3b4aad162d06f472a607d57e0675b6e))
* properly escape backticks in code blocks ([9654f60](https://github.com/KnodesCommunity/typedoc-plugins/commit/9654f600f64f7e30b5c73fd663dc2062c0870408))


### Features

* **dep: @knodes/typedoc-pluginutils:** add `writeDiag` helper ([db07c67](https://github.com/KnodesCommunity/typedoc-plugins/commit/db07c676989a211ffff1aadfc3f0da5d6a6a838c))
* **dep: @knodes/typedoc-pluginutils:** mutualize markdown replacement exclusion, modify packages ([dea1bd1](https://github.com/KnodesCommunity/typedoc-plugins/commit/dea1bd1715e8da6dec325b995480fe3e3d6cf9de)), closes [#126](https://github.com/KnodesCommunity/typedoc-plugins/issues/126)
* **dep: @knodes/typedoc-pluginutils:** throw specific error with checked path on failed resolution ([5fbce18](https://github.com/KnodesCommunity/typedoc-plugins/commit/5fbce18feb9f2cf83e6ab408b1e1020c96584db8))
* **dep: @knodes/typedoc-pluginutils:** validate options object, suggest unknown options ([78284ba](https://github.com/KnodesCommunity/typedoc-plugins/commit/78284ba84bb88613c212a1ca2563a02c5277e942))


## [0.23.1](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.23.0...v0.23.1) (2022-07-19)


### Bug Fixes

* **monorepo:** remove hacky MarkdownToSummary ([2edc787](https://github.com/KnodesCommunity/typedoc-plugins/commit/2edc78721cf5523b9cdd6d5a41290bb51e8dfed1)), closes [#130](https://github.com/KnodesCommunity/typedoc-plugins/issues/130) [TypeStrong/typedoc#2004](https://github.com/TypeStrong/typedoc/issues/2004)
* **monorepo:** windows support ([47bf765](https://github.com/KnodesCommunity/typedoc-plugins/commit/47bf765ad8c892a2bfda00562f800438f4a268ad))


## [0.23.0](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.7...v0.23.0) (2022-07-19)


### Bug Fixes

* **dep: @knodes/typedoc-pluginutils:** use correct Typedoc log methods for colors ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* **dep: @knodes/typedoc-pluginutils:** avoid considering '.' files as relative paths ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))


### Features

* add 'excludeMarkdownTags' option ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* allow selecting multiple file regions in a single block ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* implement theme interface properly (still needs demo theme) ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* use repository type to infer code block link (bitbucket not implemented) ([d21a7f7](https://github.com/KnodesCommunity/typedoc-plugins/commit/d21a7f7cc53c7b382fc7e14a897b4401f513899e))
* **dep: @knodes/typedoc-pluginutils:** add helper to create sources with repo URL ([d069278](https://github.com/KnodesCommunity/typedoc-plugins/commit/d069278d70398244a5bbf434b27b747c40ef5866))


## [0.22.7](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.6...v0.22.7) (2022-06-29)


### Bug Fixes

* **deps:** update dependency memfs to v3.4.7 ([f9acee2](https://github.com/KnodesCommunity/typedoc-plugins/commit/f9acee29c68c7525a95f40c0982b7b4981f69ab7))


## [0.22.6](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.5...v0.22.6) (2022-06-27)


### Bug Fixes

* **monorepo:** add lodash as a dependency ([6306880](https://github.com/KnodesCommunity/typedoc-plugins/commit/6306880f7c248e2ea1e94adf5bae396702db6661)), closes [#99](https://github.com/KnodesCommunity/typedoc-plugins/issues/99)
* **build:** typedoc patcher truncate file on open ([cdb4fca](https://github.com/KnodesCommunity/typedoc-plugins/commit/cdb4fca980e6ab333498de1cb7c2f5d1880522d5))
* **monorepo:** continue fixes for Windows scripts ([40f8d1d](https://github.com/KnodesCommunity/typedoc-plugins/commit/40f8d1d63bd54f6d68fb28d6a72f3be238799215))
* **monorepo:** continue normalize behaviors between windows & non-windows ([c1803ef](https://github.com/KnodesCommunity/typedoc-plugins/commit/c1803ef30033890e5ee8dbb4f94868c15e1e3805))
* **deps:** update dependency memfs to v3.4.3 ([445a9cc](https://github.com/KnodesCommunity/typedoc-plugins/commit/445a9cc2b588487dc34144130dcc0435e56a37f2))
* **monorepo:** normalize behavior between POSIX & Windows systems ([3ce9434](https://github.com/KnodesCommunity/typedoc-plugins/commit/3ce9434100e9e87d5af8a9dd6536a8ea93e5342c))


## [0.22.5](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.4...v0.22.5) (2022-04-30)


### Bug Fixes

* **deps:** update dependency semver to v7.3.7 ([42fbe4a](https://github.com/KnodesCommunity/typedoc-plugins/commit/42fbe4a60fd5e008c4d80bc269a4cc2e060c126a))


## [0.22.4](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.3...v0.22.4) (2022-04-07)


No notable changes were done in this version.


## [0.22.3](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.2...v0.22.3) (2022-03-21)


No notable changes were done in this version.


## [0.22.2](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.1...v0.22.2) (2022-03-06)


No notable changes were done in this version.


## 0.22.1 (2022-03-04)


### Bug Fixes

* **monorepo:** fix events order, bind TypeDoc prototypes to watch custom events ([83ee577](https://github.com/KnodesCommunity/typedoc-plugins/commit/83ee5776cea435fd4b5d155d1bd96f99737a5063))
* **monorepo:** various reflection path resolution fixes, better test code blocks ([314f173](https://github.com/KnodesCommunity/typedoc-plugins/commit/314f173d5430f452a9924569db8f38575337c638))


### Features

* add [@inline-codeblock](https://github.com/inline-codeblock) macro ([6d5dff4](https://github.com/KnodesCommunity/typedoc-plugins/commit/6d5dff450bc7e467ed95e88578af75ccbb8c6949))
* use new plugin format & tools ([f1d52ba](https://github.com/KnodesCommunity/typedoc-plugins/commit/f1d52bac0340bf15e65baecee46c022789dffba3))
* use pluginutils ABasePlugin, use new options format ([33b1700](https://github.com/KnodesCommunity/typedoc-plugins/commit/33b17004f75a06495931405b08e093768bf3f50c))
* use theme-like approach for code blocks rendering, add projects path alias ([37521ed](https://github.com/KnodesCommunity/typedoc-plugins/commit/37521ed38ab651bf2f5389fd7a6b0c092555caa7))
* **dep: @knodes/typedoc-pluginutils:** add `name` getter on plugin ([335095a](https://github.com/KnodesCommunity/typedoc-plugins/commit/335095a976ecedab7d1cbb64a2a1de0e4e5e7b79))
* **dep: @knodes/typedoc-pluginutils:** add better support for modules in path reflection resolution ([ff0f7c7](https://github.com/KnodesCommunity/typedoc-plugins/commit/ff0f7c790c627a8308c00c8d5426d402657d11fa))
* **dep: @knodes/typedoc-pluginutils:** add option group, add resolvePackageFile ([878baf8](https://github.com/KnodesCommunity/typedoc-plugins/commit/878baf8f713cd1f307bcde2a909ae0257d835d73))
* **dep: @knodes/typedoc-pluginutils:** add package ([f6894ad](https://github.com/KnodesCommunity/typedoc-plugins/commit/f6894ad003e7f4336407238bc6dea1fd4d9c9101))
* **dep: @knodes/typedoc-pluginutils:** add PathReflectionResolver, add plugin.relativeToRoot, use in MarkdownReplacer ([40eb1a1](https://github.com/KnodesCommunity/typedoc-plugins/commit/40eb1a1c2dca89cae27625f4234316166c652706))
* **dep: @knodes/typedoc-pluginutils:** add rootDir on plugin, add CurrentPageMemo, add MarkdownReplacer, improve Logger ([200f52f](https://github.com/KnodesCommunity/typedoc-plugins/commit/200f52f8417865734c19ed6bc8d91128a2902abe))
* **dep: @knodes/typedoc-pluginutils:** add source map support in markdown replacer ([57e5e39](https://github.com/KnodesCommunity/typedoc-plugins/commit/57e5e3925725e58677038d9b2dc9943ac42b0c96))
* **dep: @knodes/typedoc-pluginutils:** fix `wrapError`, add helper `catchWrap` ([350fc9b](https://github.com/KnodesCommunity/typedoc-plugins/commit/350fc9b9281fce5b7bd7c98253af4a4ef8f66d79))


## 0.22.0 (2022-02-23)


**First release**


No notable changes were done in this version.
