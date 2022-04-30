<!-- HEADER -->
# @knodes/typedoc-plugin-monorepo-readmes

> A TypeDoc plugin to prepend modules indexes with readmes

[![npm version](https://img.shields.io/npm/v/@knodes/typedoc-plugin-monorepo-readmes?style=for-the-badge)](https://www.npmjs.com/package/@knodes/typedoc-plugin-monorepo-readmes)
[![npm downloads](https://img.shields.io/npm/dm/@knodes/typedoc-plugin-monorepo-readmes?style=for-the-badge)](https://www.npmjs.com/package/@knodes/typedoc-plugin-monorepo-readmes)
[![Compatible with TypeDoc](https://img.shields.io/badge/For%20typedoc-^0.22.0-green?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/typedoc)

---

[![CircleCI](https://img.shields.io/circleci/build/github/KnodesCommunity/typedoc-plugins/main?style=for-the-badge)](https://circleci.com/gh/KnodesCommunity/typedoc-plugins/tree/main)
[![Code Climate coverage](https://img.shields.io/codeclimate/coverage-letter/KnodesCommunity/typedoc-plugins?style=for-the-badge)](https://codeclimate.com/github/KnodesCommunity/typedoc-plugins)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability/KnodesCommunity/typedoc-plugins?style=for-the-badge)](https://codeclimate.com/github/KnodesCommunity/typedoc-plugins)

## Compatibility

This plugin version should match TypeDoc `^0.22.0` for compatibility.

> **Note**: this plugin version was released by testing against `^0.22.15`.

## Quick start

```sh
npm install --save-dev @knodes/typedoc-plugin-monorepo-readmes typedoc@^0.22.0
```

For more infos, please refer to [the documentation](https://knodescommunity.github.io/typedoc-plugins/modules/_knodes_typedoc_plugin_monorepo_readmes.html)
<!-- HEADER end -->

## Features

- 🎨 Compatible with the default theme
- 📁 Built for monorepos
- 🎯 Compatible with [`@knodes/typedoc-plugin-pages` indexes](https://www.npmjs.com/package/@knodes/typedoc-plugin-pages)

## Usage

Simply create `README.md` files next to your `package.json` in your monorepo projects/workspaces. You can configure different files so the plugin find
the README.md next to them.

> Example: If you have a NX Monorepo, you might have only one `package.json` in the root and the libraries would use a `project.json`
file. In this case you would set the configuration `"pluginMonorepoReadmes:rootFiles": ["project.json", "package.json"]` and we would look for README.md near `project.json`
and if none is found, we would fallback to `package.json`. Therefore you can see that the order of the files defined in the array is important. You can pass
any file in the array, so you could even use `"pluginMonorepoReadmes:rootFiles": ["README.md"]` and this would find the closest README.md to your module source.
>
> Note that `rootFiles` are case-sensitive.

For more information on configuration, please refer to [the *options* documentation page](https://knodescommunity.github.io/typedoc-plugins/_knodes_typedoc_plugin_monorepo_readmes/pages/options.html)