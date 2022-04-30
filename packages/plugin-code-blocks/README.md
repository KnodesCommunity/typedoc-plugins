<!-- HEADER -->
# @knodes/typedoc-plugin-code-blocks

> A TypeDoc plugin to embed source code into your output documentation

[![npm version](https://img.shields.io/npm/v/@knodes/typedoc-plugin-code-blocks?style=for-the-badge)](https://www.npmjs.com/package/@knodes/typedoc-plugin-code-blocks)
[![npm downloads](https://img.shields.io/npm/dm/@knodes/typedoc-plugin-code-blocks?style=for-the-badge)](https://www.npmjs.com/package/@knodes/typedoc-plugin-code-blocks)
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
npm install --save-dev @knodes/typedoc-plugin-code-blocks typedoc@^0.22.0
```

For more infos, please refer to [the documentation](https://knodescommunity.github.io/typedoc-plugins/modules/_knodes_typedoc_plugin_code_blocks.html)
<!-- HEADER end -->

## Features

- 🔗 Source hyperlinks
- 🎨 Compatible with the default theme
- 📁 Monorepo support
- 🎯 Locate invalid markups

## Usage

In any markdown content, you can use the `{@codeblock ...}` & `{@inline-codeblock ...}` macros to use code blocks.

### Reference a file

Syntax:
```md
{@codeblock <path-to-file>[#region] [mode] [ | custom-file-name]}
```

* `<path-to-file>`: A path to the code file to embed. The file resolution is as follow:
  * If the path starts with a `.`, search from the current file.
  * If the path starts with `~~/`, search from the project root.
  * If the path starts with `~[....]/`, search from the module/workspace with the given name.
  * Otherwise, the page is searched from the current module/workspace (or the project root).
* `[#region]`: A named region in the target file. Regions are started with `// #region my-name`, & ended with `// #endregion [my-name]`. Interleaved/nested regions are supported. Note that region markers are not outputted in the generated code block.
* `[mode]`: optional. Can be any valid {@link EBlockMode}, to override the default settings.
* `[ | custom-file-name]`: allow to specify an explicit file name to display in the code block header.

Module/workspace/project resolution first tries to search in the `examples` subfolder. You can customize this setting with the `source` option.

### Wrap standard markdown content

Syntax:
````md
{@inline-codeblock <custom-file-name> [mode]}
```
....
```
````

* `<custom-file-name>`: The file name to set in the header
* `[mode]`: optional. Can be any valid {@link EBlockMode}, to override the default settings.
