## [0.23.1](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.23.0...v0.23.1) (2022-07-19)


No notable changes were done in this version.


### Bug Fixes

* **monorepo**: remove hacky MarkdownToSummary ([2edc787](https://github.com/KnodesCommunity/typedoc-plugins/commit/2edc78721cf5523b9cdd6d5a41290bb51e8dfed1)), closes [#130](https://github.com/KnodesCommunity/typedoc-plugins/issues/130) [TypeStrong/typedoc#2004](https://github.com/TypeStrong/typedoc/issues/2004)
* **monorepo**: windows support ([47bf765](https://github.com/KnodesCommunity/typedoc-plugins/commit/47bf765ad8c892a2bfda00562f800438f4a268ad))


# [0.23.0](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.7...v0.23.0) (2022-07-19)


### Bug Fixes

* use correct Typedoc log methods for colors ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))
* avoid considering '.' files as relative paths ([c02d8a](https://github.com/KnodesCommunity/typedoc-plugins/commit/c02d8a0dad05325005257537bdb405a847e875a5))


### Features

* add helper to create sources with repo URL ([d069278](https://github.com/KnodesCommunity/typedoc-plugins/commit/d069278d70398244a5bbf434b27b747c40ef5866))


## [0.22.7](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.6...v0.22.7) (2022-06-29)


No notable changes were done in this version.


### Bug Fixes

* **deps**: update dependency memfs to v3.4.7 ([f9acee2](https://github.com/KnodesCommunity/typedoc-plugins/commit/f9acee29c68c7525a95f40c0982b7b4981f69ab7))


## [0.22.6](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.5...v0.22.6) (2022-06-27)


No notable changes were done in this version.


### Bug Fixes

* **monorepo**: add lodash as a dependency ([6306880](https://github.com/KnodesCommunity/typedoc-plugins/commit/6306880f7c248e2ea1e94adf5bae396702db6661)), closes [#99](https://github.com/KnodesCommunity/typedoc-plugins/issues/99)
* **build**: typedoc patcher truncate file on open ([cdb4fca](https://github.com/KnodesCommunity/typedoc-plugins/commit/cdb4fca980e6ab333498de1cb7c2f5d1880522d5))
* **monorepo**: continue fixes for Windows scripts ([40f8d1d](https://github.com/KnodesCommunity/typedoc-plugins/commit/40f8d1d63bd54f6d68fb28d6a72f3be238799215))
* **monorepo**: continue normalize behaviors between windows & non-windows ([c1803ef](https://github.com/KnodesCommunity/typedoc-plugins/commit/c1803ef30033890e5ee8dbb4f94868c15e1e3805))
* **deps**: update dependency memfs to v3.4.3 ([445a9cc](https://github.com/KnodesCommunity/typedoc-plugins/commit/445a9cc2b588487dc34144130dcc0435e56a37f2))
* **deps**: update dependency memfs to v3.4.4 ([2d83aa6](https://github.com/KnodesCommunity/typedoc-plugins/commit/2d83aa6758ed3f8cf8d32a0953aee641a3ee46df))
* **monorepo**: normalize behavior between POSIX & Windows systems ([3ce9434](https://github.com/KnodesCommunity/typedoc-plugins/commit/3ce9434100e9e87d5af8a9dd6536a8ea93e5342c))


## [0.22.5](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.4...v0.22.5) (2022-04-30)


No notable changes were done in this version.


### Bug Fixes

* **deps**: update dependency semver to v7.3.7 ([42fbe4a](https://github.com/KnodesCommunity/typedoc-plugins/commit/42fbe4a60fd5e008c4d80bc269a4cc2e060c126a))


## [0.22.4](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.3...v0.22.4) (2022-04-07)


No notable changes were done in this version.


## [0.22.3](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.2...v0.22.3) (2022-03-21)


No notable changes were done in this version.


## [0.22.2](https://github.com/KnodesCommunity/typedoc-plugins/compare/v0.22.1...v0.22.2) (2022-03-06)


No notable changes were done in this version.


## 0.22.1 (2022-03-04)


No notable changes were done in this version.


### Bug Fixes

* **monorepo**: fix events order, bind TypeDoc prototypes to watch custom events ([83ee577](https://github.com/KnodesCommunity/typedoc-plugins/commit/83ee5776cea435fd4b5d155d1bd96f99737a5063))
* **monorepo**: various reflection path resolution fixes, better test code blocks ([314f173](https://github.com/KnodesCommunity/typedoc-plugins/commit/314f173d5430f452a9924569db8f38575337c638))


### Features

* add `name` getter on plugin ([335095a](https://github.com/KnodesCommunity/typedoc-plugins/commit/335095a976ecedab7d1cbb64a2a1de0e4e5e7b79))
* add better support for modules in path reflection resolution ([ff0f7c7](https://github.com/KnodesCommunity/typedoc-plugins/commit/ff0f7c790c627a8308c00c8d5426d402657d11fa))
* add option group, add resolvePackageFile ([878baf8](https://github.com/KnodesCommunity/typedoc-plugins/commit/878baf8f713cd1f307bcde2a909ae0257d835d73))
* add package ([f6894ad](https://github.com/KnodesCommunity/typedoc-plugins/commit/f6894ad003e7f4336407238bc6dea1fd4d9c9101))
* add PathReflectionResolver, add plugin.relativeToRoot, use in MarkdownReplacer ([40eb1a1](https://github.com/KnodesCommunity/typedoc-plugins/commit/40eb1a1c2dca89cae27625f4234316166c652706))
* add rootDir on plugin, add CurrentPageMemo, add MarkdownReplacer, improve Logger ([200f52f](https://github.com/KnodesCommunity/typedoc-plugins/commit/200f52f8417865734c19ed6bc8d91128a2902abe))
* add source map support in markdown replacer ([57e5e39](https://github.com/KnodesCommunity/typedoc-plugins/commit/57e5e3925725e58677038d9b2dc9943ac42b0c96))
* fix `wrapError`, add helper `catchWrap` ([350fc9b](https://github.com/KnodesCommunity/typedoc-plugins/commit/350fc9b9281fce5b7bd7c98253af4a4ef8f66d79))


# 0.22.0 (2022-02-23)


## 0.0.1 (2022-02-23)


