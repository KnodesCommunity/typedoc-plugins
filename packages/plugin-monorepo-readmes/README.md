<!-- HEADER -->
# @knodes/typedoc-plugin-monorepo-readmes

> A TypeDoc plugin to prepend modules indexes with readmes

[![npm version](https://img.shields.io/npm/v/@knodes/typedoc-plugin-monorepo-readmes?style=for-the-badge)](https://www.npmjs.com/package/@knodes/typedoc-plugin-monorepo-readmes)
[![npm downloads](https://img.shields.io/npm/dm/@knodes/typedoc-plugin-monorepo-readmes?style=for-the-badge)](https://www.npmjs.com/package/@knodes/typedoc-plugin-monorepo-readmes)
[![Compatible with TypeDoc](https://img.shields.io/badge/For%20typedoc-^0.23.0-green?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/typedoc)

---

[![CircleCI](https://img.shields.io/circleci/build/github/KnodesCommunity/typedoc-plugins/main?style=for-the-badge)](https://circleci.com/gh/KnodesCommunity/typedoc-plugins/tree/main)
[![Code Climate coverage](https://img.shields.io/codeclimate/coverage-letter/KnodesCommunity/typedoc-plugins?style=for-the-badge)](https://codeclimate.com/github/KnodesCommunity/typedoc-plugins)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability/KnodesCommunity/typedoc-plugins?style=for-the-badge)](https://codeclimate.com/github/KnodesCommunity/typedoc-plugins)

For more infos, please refer to [the documentation](https://knodescommunity.github.io/typedoc-plugins/modules/_knodes_typedoc_plugin_monorepo_readmes.html)
<!-- HEADER end -->

## Features

- 🎨 Compatible with the default theme
- 📁 Built for monorepos
- 🎯 Compatible with [`@knodes/typedoc-plugin-pages` indexes](https://www.npmjs.com/package/@knodes/typedoc-plugin-pages)

## Usage

Simply create `README.md` files next to your `package.json` in your monorepo projects/workspaces.

You can configure file names to search to get the workspace root with the [`pluginMonorepoReadmes:rootFiles` option](https://knodescommunity.github.io/typedoc-plugins/_knodes_typedoc_plugin_monorepo_readmes/pages/options.html).

> Example: for NX Monorepo, set it to `["project.json", "package.json"]` to correctly match both libraries & root. You could even use `"pluginMonorepoReadmes:rootFiles": ["README.md"]` to match the closest `README.md` file in any parent directory.
>
> Note that `rootFiles` are case-sensitive.

## Configuration

For more information on configuration, please refer to [the *options* documentation page](https://knodescommunity.github.io/typedoc-plugins/_knodes_typedoc_plugin_monorepo_readmes/pages/options.html)

<!-- INSTALL -->

## Quick start

```sh
npm install --save-dev @knodes/typedoc-plugin-monorepo-readmes typedoc@^0.23.0
```

## Compatibility

This plugin version should match TypeDoc `^0.23.0` for compatibility.

> **Note**: this plugin version was released by testing against `^0.23.7`.

<!-- INSTALL end -->
