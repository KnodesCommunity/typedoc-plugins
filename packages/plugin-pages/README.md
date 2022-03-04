<!-- HEADER -->
# @knodes/typedoc-plugin-pages

> A TypeDoc plugin that lets you integrate your own pages into the documentation output

[![npm](https://img.shields.io/npm/v/knodes/typedoc-plugin-pages)](https://www.npmjs.com/package/@knodes/typedoc-plugin-pages)

## Compatibility

This plugin version should match TypeDoc `^0.22.0` for compatibility.

## Quick start

```sh
npm install --save-dev @knodes/typedoc-plugin-pages typedoc@^0.22.0
```

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