<!-- HEADER -->
# @knodes/typedoc-plugin-pages

> A TypeDoc plugin that lets you integrate your own pages into the documentation output

[![npm version](https://img.shields.io/npm/v/@knodes/typedoc-plugin-pages?style=for-the-badge)](https://www.npmjs.com/package/@knodes/typedoc-plugin-pages)
[![npm downloads](https://img.shields.io/npm/dm/@knodes/typedoc-plugin-pages?style=for-the-badge)](https://www.npmjs.com/package/@knodes/typedoc-plugin-pages)
[![Compatible with TypeDoc](https://img.shields.io/badge/For%20typedoc-^0.23.0-green?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/typedoc)

---

[![CircleCI](https://img.shields.io/circleci/build/github/KnodesCommunity/typedoc-plugins/main?style=for-the-badge)](https://circleci.com/gh/KnodesCommunity/typedoc-plugins/tree/main)
[![Code Climate coverage](https://img.shields.io/codeclimate/coverage-letter/KnodesCommunity/typedoc-plugins?style=for-the-badge)](https://codeclimate.com/github/KnodesCommunity/typedoc-plugins)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability/KnodesCommunity/typedoc-plugins?style=for-the-badge)](https://codeclimate.com/github/KnodesCommunity/typedoc-plugins)

For more infos, please refer to [the documentation](https://knodescommunity.github.io/typedoc-plugins/modules/_knodes_typedoc_plugin_pages.html)
<!-- HEADER end -->

## Features

- 🔍 Search integration
- 🔗 Interpage hyperlinks
- 🎨 Compatible with the default theme
- 📁 Monorepo support
- 🎯 Locate invalid markups

## Usage

1. Create markdown files into your repository (by default in the `pages` directory).
2. Configure your pages tree in the typedoc configuration. Example:
   ```json
   {
   	"pluginPages": {
   		"pages": [ { "name": "My project name", "moduleRoot": true, "children": [
   			{ "name": "Some cool docs", "source": "cool-docs.md" },
   			{ "name": "Configuration", "childrenDir": "configuration", "children": [
   				{ "name": "Configuration file", "source": "file.md" },
   				{ "name": "CLI options", "source": "cli.md" },
   			] },
   		] } ]
   	}
   }
   ```
   See [the *pages* tree guide](https://knodescommunity.github.io/typedoc-plugins/_knodes_typedoc_plugin_pages/pages/pages-tree.html), or [the *options* documentation page](https://knodescommunity.github.io/typedoc-plugins/_knodes_typedoc_plugin_pages/pages/options.html) for more infos.
3. In any markdown content (in README, pages, or doc comments), use the `{@page ...}` tag to create a link to a page.

Syntax:

```md
{@page <path-to-file>[ link label]}
```

* `<path-to-file>`: A path to the desired page. Checkout [this documentation page](https://knodescommunity.github.io/typedoc-plugins/_knodes_typedoc_pluginutils/pages/resolving-paths.html) for more infos on the syntax of the path.
* `[ link label]`: allow to specify the text in the link. If not set, the target page name is used.

<!-- INSTALL -->
## Quick start

```sh
npm install --save-dev @knodes/typedoc-plugin-pages typedoc@^0.23.0
```

## Compatibility

This plugin version should match TypeDoc `^0.23.0` for compatibility.

> **Note**: this plugin version was released by testing against `^0.23.8`.
<!-- INSTALL end -->

> **NOTE:** This plugin is based on [typedoc-plugin-loopingz-pages](https://github.com/loopingz/typedoc-plugin-loopingz-pages), which is in turn a fork of [typedoc-plugin-pages](https://github.com/mipatterson/typedoc-plugin-pages). Integrating it in this monorepo should (I hope) make easier maintenance.<!-- INSTALL -->

