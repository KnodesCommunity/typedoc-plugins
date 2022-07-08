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

## Compatibility

This plugin version should match TypeDoc `^0.23.0` for compatibility.

> **Note**: this plugin version was released by testing against `^0.23.6`.

## Quick start

```sh
npm install --save-dev @knodes/typedoc-plugin-pages typedoc@^0.23.0
```

For more infos, please refer to [the documentation](https://knodescommunity.github.io/typedoc-plugins/modules/_knodes_typedoc_plugin_pages.html)
<!-- HEADER end -->

> **NOTE:** This plugin is based on [typedoc-plugin-loopingz-pages](https://github.com/loopingz/typedoc-plugin-loopingz-pages), which is in turn a fork of [typedoc-plugin-pages](https://github.com/mipatterson/typedoc-plugin-pages). Integrating it in this monorepo should (I hope) make easier maintainance.

## Features

- 🔍 Search integration
- 🔗 Interpage hyperlinks
- 🎨 Compatible with the default theme
- 📁 Monorepo support
- 🎯 Locate invalid markups

## Usage

In any markdown content, you can use the `{@page ...}` macro to lookup for pages.

Syntax:

```md
{@page <path-to-file>[ link label]}
```

* `<path-to-file>`: A path to the desired page. The page resolution is as follow:
  * If the path starts with a `.`, search from the current file.
  * If the path starts with `~~/`, search from the project root.
  * If the path starts with `~[....]/`, search from the module/workspace with the given name.
  * Otherwise, the page is searched from the current module/workspace (or the project root).
* `[ link label]`: allow to specify the text in the link.

Module/workspace/project resolution first tries to search in the `pages` subfolder. You can customize this setting with the `source` option.

## Configuration

For more information on configuration, please refer to [the *options* documentation page](https://knodescommunity.github.io/typedoc-plugins/_knodes_typedoc_plugin_pages/pages/options.html)