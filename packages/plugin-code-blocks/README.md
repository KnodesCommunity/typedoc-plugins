<!-- HEADER -->
# @knodes/typedoc-plugin-code-blocks

> A TypeDoc plugin to embed source code into your output documentation

[![npm version](https://img.shields.io/npm/v/@knodes/typedoc-plugin-code-blocks?style=for-the-badge)](https://www.npmjs.com/package/@knodes/typedoc-plugin-code-blocks)
[![npm downloads](https://img.shields.io/npm/dm/@knodes/typedoc-plugin-code-blocks?style=for-the-badge)](https://www.npmjs.com/package/@knodes/typedoc-plugin-code-blocks)
[![Compatible with TypeDoc](https://img.shields.io/badge/For%20typedoc-^0.23.0-green?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/typedoc)

---

[![CircleCI](https://img.shields.io/circleci/build/github/KnodesCommunity/typedoc-plugins/main?style=for-the-badge)](https://circleci.com/gh/KnodesCommunity/typedoc-plugins/tree/main)
[![Code Climate coverage](https://img.shields.io/codeclimate/coverage-letter/KnodesCommunity/typedoc-plugins?style=for-the-badge)](https://codeclimate.com/github/KnodesCommunity/typedoc-plugins)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability/KnodesCommunity/typedoc-plugins?style=for-the-badge)](https://codeclimate.com/github/KnodesCommunity/typedoc-plugins)

For more infos, please refer to [the documentation](https://knodescommunity.github.io/typedoc-plugins/modules/_knodes_typedoc_plugin_code_blocks.html)
<!-- HEADER end -->

## Features

- 🔗 Source hyperlinks
- 🎨 Compatible with the default theme
- 📁 Monorepo support
- 🎯 Locate invalid markups

## Usage

In any markdown content, (in README, pages, or doc comments), use the `{@codeblock ...}` & `{@inlineCodeblock ...}` macros to use code blocks.

### Reference a file

Syntax:
```md
{@codeblock <path-to-file>[#region] [mode] [ | custom-file-name]}
```

* `<path-to-file>`: A path to the code file to embed. Checkout [this documentation page](https://knodescommunity.github.io/typedoc-plugins/_knodes_typedoc_pluginutils/pages/resolving-paths.html) for more infos on the syntax of the path.
* `[#<region>]`: A named region in the target file. Regions are started with `// #region my-name`, & ended with `// #endregion [my-name]`. Interleaved/nested regions are supported. Note that region markers are not outputted in the generated code block. The `<region>` parameter can be a glob pattern, or a list of block names/patterns separated by a `+`.
* `[mode]`: optional. Can be any valid {@link EBlockMode}, to override the default settings.
* `[ | custom-file-name]`: allow to specify an explicit file name to display in the code block header.
* 
`{@codeblock ...}` are by default looked up into your [*workspace*](https://knodescommunity.github.io/typedoc-plugins/_knodes_typedoc_pluginutils/pages/resolving-paths.html) `examples` folder, but you can customize it by using the [`source` option](https://knodescommunity.github.io/typedoc-plugins/_knodes_typedoc_plugin_code_blocks/pages/options.html)

### Wrap standard markdown content

Syntax:
````md
{@inlineCodeblock <custom-file-name> [mode] ```
....
```}
````

* `<custom-file-name>`: The file name to set in the header
* `[mode]`: optional. Can be any valid {@link EBlockMode}, to override the default settings.

## Configuration

For more information on configuration, please refer to [the *options* documentation page](https://knodescommunity.github.io/typedoc-plugins/_knodes_typedoc_plugin_code_blocks/pages/options.html)

<!-- INSTALL -->
## Quick start

```sh
npm install --save-dev @knodes/typedoc-plugin-code-blocks typedoc@^0.23.0
```

## Compatibility

This plugin version should match TypeDoc `^0.23.0` for compatibility.

> **Note**: this plugin version was released by testing against `^0.23.8`.
<!-- INSTALL end -->
