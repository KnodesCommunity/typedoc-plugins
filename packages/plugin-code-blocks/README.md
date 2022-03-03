<!-- HEADER -->
# @knodes/typedoc-plugin-code-blocks

> A TypeDoc plugin to embed source code into your output documentation

[![npm](https://img.shields.io/npm/v/knodes/typedoc-plugin-code-blocks)](https://www.npmjs.com/package/@knodes/typedoc-plugin-code-blocks)

## Compatibility

This plugin version should match TypeDoc `^0.22.0` for compatibility.

## Quick start

```sh
npm install --save-dev @knodes/typedoc-plugin-code-blocks typedoc@^0.22.0
```

<!-- HEADER end -->

### Use

In any markdown content, you can use the `{@codeblock ...}` macro to lookup for files.

Syntax: `{@codeblock <named-directory>/<path-to-file-in-dir>[#region] [mode] [ | custom-file-name]}`

* `[#region]`: A named region in the target file. Regions are started with `// #region my-name`, & ended with `// #endregion [my-name]`. Interleaved/nested regions are supported. Note that region markers are not outputted in the generated code block.
* `[mode]`: optional. Can be any valid {@link EBlockMode}, to override the default settings.
* `[ | custom-file-name]`: allow to specify an explicit file name to display in the code block header.