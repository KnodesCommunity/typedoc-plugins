## [0.23.2](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.23.1...v0.23.2) (2023-04-05)


### Bug Fixes

* always use normalized paths ([b2dc4ff](https://github.com/KnodesCommunity/typedoc-plugins/commit/b2dc4ff053481795e09b86b21a5371ee17dc6008))
* **deps:** update dependencies ([413ae46](https://github.com/KnodesCommunity/typedoc-plugins/commit/413ae469d67d2c242bf8eb0b226b19c04f8b4472))
* **deps:** update dependency memfs to v3.4.10 ([27a52ef](https://github.com/KnodesCommunity/typedoc-plugins/commit/27a52efb9b1eafade2de6ccac46fb41a26f7b5da))
* **deps:** update dependency semver to v7.3.8 ([c14eae1](https://github.com/KnodesCommunity/typedoc-plugins/commit/c14eae17d3b4aad162d06f472a607d57e0675b6e))
* **plugin-code-blocks:** properly escape backticks in code blocks ([9654f60](https://github.com/KnodesCommunity/typedoc-plugins/commit/9654f600f64f7e30b5c73fd663dc2062c0870408))
* **plugin-pages:** don't output page with explicit children output to \{page\}/index.html ([937f8ea](https://github.com/KnodesCommunity/typedoc-plugins/commit/937f8ea298e612565b8e268ccd6aa5a700dbdefb))
* **plugin-pages:** module appendix URLs targets the module ([95b5376](https://github.com/KnodesCommunity/typedoc-plugins/commit/95b5376e2c51ade74626afb287b1fa6a862d0805))
* **plugin-pages:** properly use configuration to handle unresolved links ([a9e1499](https://github.com/KnodesCommunity/typedoc-plugins/commit/a9e149910263d45176e235d1af97ea66a9ff6b4a))


### Features

* **plugintestbed:** fake repository for stable tests results ([bbfdf91](https://github.com/KnodesCommunity/typedoc-plugins/commit/bbfdf91bbd052ad4c1f27e359f5c3cc5ac9e8cd3))
* **pluginutils:** add `writeDiag` helper ([db07c67](https://github.com/KnodesCommunity/typedoc-plugins/commit/db07c676989a211ffff1aadfc3f0da5d6a6a838c))
* **pluginutils:** mutualize markdown replacement exclusion, modify packages ([dea1bd1](https://github.com/KnodesCommunity/typedoc-plugins/commit/dea1bd1715e8da6dec325b995480fe3e3d6cf9de)), closes [#126](https://github.com/KnodesCommunity/typedoc-plugins/issues/126)
* **pluginutils:** throw specific error with checked path on failed resolution ([5fbce18](https://github.com/KnodesCommunity/typedoc-plugins/commit/5fbce18feb9f2cf83e6ab408b1e1020c96584db8))
* **pluginutils:** validate options object, suggest unknown options ([78284ba](https://github.com/KnodesCommunity/typedoc-plugins/commit/78284ba84bb88613c212a1ca2563a02c5277e942))



## [0.23.1](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.23.0...v0.23.1) (2022-07-19)


### Bug Fixes

* remove hacky MarkdownToSummary ([2edc787](https://github.com/KnodesCommunity/typedoc-plugins/commit/2edc78721cf5523b9cdd6d5a41290bb51e8dfed1)), closes [#130](https://github.com/KnodesCommunity/typedoc-plugins/issues/130) [TypeStrong/typedoc#2004](https://github.com/TypeStrong/typedoc/issues/2004)
* windows support ([47bf765](https://github.com/KnodesCommunity/typedoc-plugins/commit/47bf765ad8c892a2bfda00562f800438f4a268ad))



## [0.23.0](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.7...v0.23.0) (2022-07-19)


### Bug Fixes

* **pluginutils:** use correct Typedoc log methods for colors ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* **pluginutils:** avoid considering '.' files as relative paths ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))


### Features

* **plugin-pages:** add 'excludeMarkdownTags' option ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* **plugin-pages:** rework how pages are mapped to modules ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* **plugin-pages:** improve `pages` option validation ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* **plugin-pages:** implement theme interface properly (still needs demo theme) ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* **plugin-code-blocks:** add 'excludeMarkdownTags' option ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* **plugin-code-blocks:** allow selecting multiple file regions in a single block ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* **plugin-code-blocks:** implement theme interface properly (still needs demo theme) ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* **plugin-monorepo-readmes:** implement theme interface properly (still needs demo theme) ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* **plugin-code-blocks:** use repository type to infer code block link (bitbucket not implemented) ([d21a7f7](https://github.com/KnodesCommunity/typedoc-plugins/commit/d21a7f7cc53c7b382fc7e14a897b4401f513899e))
* **plugin-monorepo-readmes:** add properly formatted link to README in  section of workspaces ([e139146](https://github.com/KnodesCommunity/typedoc-plugins/commit/e139146ba31cfe8b40d924ce605cd9fc09b521f3))
* **plugin-pages:** add properly formatted link in  section of workspace roots ([dee3355](https://github.com/KnodesCommunity/typedoc-plugins/commit/dee33558e72a349d8bbaee2edb35e2952a1c6431))
* **plugintestbed:** forbid warn/error logger in mock plugin by default ([0081e0d](https://github.com/KnodesCommunity/typedoc-plugins/commit/0081e0d67bf2ab50ad387d2f3352c23d753f2d9e))
* **pluginutils:** add helper to create sources with repo URL ([d069278](https://github.com/KnodesCommunity/typedoc-plugins/commit/d069278d70398244a5bbf434b27b747c40ef5866))



## [0.22.7](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.6...v0.22.7) (2022-06-29)


### Bug Fixes

* **deps:** update dependency memfs to v3.4.7 ([f9acee2](https://github.com/KnodesCommunity/typedoc-plugins/commit/f9acee29c68c7525a95f40c0982b7b4981f69ab7))
* **plugin-pages:** include GENERATED files in package ([88ff876](https://github.com/KnodesCommunity/typedoc-plugins/commit/88ff876631b4fa1d97f50ede3eeba30e69fc47ff))



## [0.22.6](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.5...v0.22.6) (2022-06-27)


### Bug Fixes

* add lodash as a dependency ([6306880](https://github.com/KnodesCommunity/typedoc-plugins/commit/6306880f7c248e2ea1e94adf5bae396702db6661)), closes [#99](https://github.com/KnodesCommunity/typedoc-plugins/issues/99)
* **build:** typedoc patcher truncate file on open ([cdb4fca](https://github.com/KnodesCommunity/typedoc-plugins/commit/cdb4fca980e6ab333498de1cb7c2f5d1880522d5))
* continue fixes for Windows scripts ([40f8d1d](https://github.com/KnodesCommunity/typedoc-plugins/commit/40f8d1d63bd54f6d68fb28d6a72f3be238799215))
* continue normalize behaviors between windows & non-windows ([c1803ef](https://github.com/KnodesCommunity/typedoc-plugins/commit/c1803ef30033890e5ee8dbb4f94868c15e1e3805))
* **deps:** update dependency memfs to v3.4.3 ([445a9cc](https://github.com/KnodesCommunity/typedoc-plugins/commit/445a9cc2b588487dc34144130dcc0435e56a37f2))
* normalize behavior between POSIX & Windows systems ([3ce9434](https://github.com/KnodesCommunity/typedoc-plugins/commit/3ce9434100e9e87d5af8a9dd6536a8ea93e5342c))



## [0.22.5](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.4...v0.22.5) (2022-04-30)


### Bug Fixes

* **deps:** update dependency semver to v7.3.7 ([42fbe4a](https://github.com/KnodesCommunity/typedoc-plugins/commit/42fbe4a60fd5e008c4d80bc269a4cc2e060c126a))


### Features

* **plugin-monorepo-readmes:** add option to pass different targets to find the closest README.md near to them ([2dc6806](https://github.com/KnodesCommunity/typedoc-plugins/commit/2dc6806fffbb1b2bbaae4554fedafdff55ac1203))



## [0.22.4](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.3...v0.22.4) (2022-04-07)



## [0.22.3](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.2...v0.22.3) (2022-03-21)


### Bug Fixes

* **plugin-monorepo-readmes:** properly resolve README.md from module source ([186e361](https://github.com/KnodesCommunity/typedoc-plugins/commit/186e3616f8e42dae7d6c74631daee44e214568cb)), closes [#21](https://github.com/KnodesCommunity/typedoc-plugins/issues/21)



## [0.22.2](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.1...v0.22.2) (2022-03-06)


### Bug Fixes

* **plugin-pages:** include missing `static` folder in package files ([1889d89](https://github.com/KnodesCommunity/typedoc-plugins/commit/1889d8919b90bb8716bd9b6d97962bab5ad17132))



## 0.22.1 (2022-03-04)


### Bug Fixes

* fix events order, bind TypeDoc prototypes to watch custom events ([83ee577](https://github.com/KnodesCommunity/typedoc-plugins/commit/83ee5776cea435fd4b5d155d1bd96f99737a5063))
* various reflection path resolution fixes, better test code blocks ([314f173](https://github.com/KnodesCommunity/typedoc-plugins/commit/314f173d5430f452a9924569db8f38575337c638))


### Features

* **plugin-code-blocks:** add [@inline-codeblock](https://github.com/inline-codeblock) macro ([6d5dff4](https://github.com/KnodesCommunity/typedoc-plugins/commit/6d5dff450bc7e467ed95e88578af75ccbb8c6949))
* **plugin-code-blocks:** use new plugin format & tools ([f1d52ba](https://github.com/KnodesCommunity/typedoc-plugins/commit/f1d52bac0340bf15e65baecee46c022789dffba3))
* **plugin-code-blocks:** use pluginutils ABasePlugin, use new options format ([33b1700](https://github.com/KnodesCommunity/typedoc-plugins/commit/33b17004f75a06495931405b08e093768bf3f50c))
* **plugin-code-blocks:** use theme-like approach for code blocks rendering, add projects path alias ([37521ed](https://github.com/KnodesCommunity/typedoc-plugins/commit/37521ed38ab651bf2f5389fd7a6b0c092555caa7))
* **plugin-monorepo-readmes:** add plugin ([7c9bc9c](https://github.com/KnodesCommunity/typedoc-plugins/commit/7c9bc9c167211a0201a54559c0f75ee5fc249f12))
* **plugin-pages:** add plugin ([2434d33](https://github.com/KnodesCommunity/typedoc-plugins/commit/2434d33399ec66e3c876e2a54cfa8a66bae77966))
* **plugin-pages:** add search support ([08242d4](https://github.com/KnodesCommunity/typedoc-plugins/commit/08242d4449c84dd9bdf3af7c9c98dee496c15d59))
* **plugin-pages:** add support for plugin-scoped log level ([48984d5](https://github.com/KnodesCommunity/typedoc-plugins/commit/48984d5aa67bde7c660e731200a0171b11f8e5a6))
* **plugin-pages:** allow relative resolution of pages, add `~~` alias, change render link signature ([8676ae4](https://github.com/KnodesCommunity/typedoc-plugins/commit/8676ae47f068a1b6ec76f4dd245e80f5e08e2d09))
* **plugin-pages:** fallback default theme: add css file, stylize menu entries ([4bc43f0](https://github.com/KnodesCommunity/typedoc-plugins/commit/4bc43f011496c971f73ae5230f79f30c806a66d0))
* **plugin-pages:** remove `workspace` node field (attach to module by name), various tweaks & fixes ([31e906a](https://github.com/KnodesCommunity/typedoc-plugins/commit/31e906abeba79a39d6d31b4c2fd3686d2e0f15a0))
* **plugin-pages:** strip empty groups with a warning message ([3a7733d](https://github.com/KnodesCommunity/typedoc-plugins/commit/3a7733d0a0f07f374ef367ecc723390d7d0550df))
* **plugin-pages:** use new option format, fix issue with pages ordering, rework theme plugins ([0afdf9d](https://github.com/KnodesCommunity/typedoc-plugins/commit/0afdf9deb168f3330d3ee7e8c5ffdba81dc4f2ba))
* **plugin-pages:** validate pages option ([1634a2e](https://github.com/KnodesCommunity/typedoc-plugins/commit/1634a2ee40b97dfff9c81f4574e9ca72c8df47fc))
* **plugintestbed:** add package ([fac9bfb](https://github.com/KnodesCommunity/typedoc-plugins/commit/fac9bfb31b40a52de790a990c7b5bc71dd354580))
* **pluginutils:** add `name` getter on plugin ([335095a](https://github.com/KnodesCommunity/typedoc-plugins/commit/335095a976ecedab7d1cbb64a2a1de0e4e5e7b79))
* **pluginutils:** add better support for modules in path reflection resolution ([ff0f7c7](https://github.com/KnodesCommunity/typedoc-plugins/commit/ff0f7c790c627a8308c00c8d5426d402657d11fa))
* **pluginutils:** add option group, add resolvePackageFile ([878baf8](https://github.com/KnodesCommunity/typedoc-plugins/commit/878baf8f713cd1f307bcde2a909ae0257d835d73))
* **pluginutils:** add package ([f6894ad](https://github.com/KnodesCommunity/typedoc-plugins/commit/f6894ad003e7f4336407238bc6dea1fd4d9c9101))
* **pluginutils:** add PathReflectionResolver, add plugin.relativeToRoot, use in MarkdownReplacer ([40eb1a1](https://github.com/KnodesCommunity/typedoc-plugins/commit/40eb1a1c2dca89cae27625f4234316166c652706))
* **pluginutils:** add rootDir on plugin, add CurrentPageMemo, add MarkdownReplacer, improve Logger ([200f52f](https://github.com/KnodesCommunity/typedoc-plugins/commit/200f52f8417865734c19ed6bc8d91128a2902abe))
* **pluginutils:** add source map support in markdown replacer ([57e5e39](https://github.com/KnodesCommunity/typedoc-plugins/commit/57e5e3925725e58677038d9b2dc9943ac42b0c96))
* **pluginutils:** fix `wrapError`, add helper `catchWrap` ([350fc9b](https://github.com/KnodesCommunity/typedoc-plugins/commit/350fc9b9281fce5b7bd7c98253af4a4ef8f66d79))



## 0.22.0 (2022-02-23)



## 0.0.1 (2022-02-23)



