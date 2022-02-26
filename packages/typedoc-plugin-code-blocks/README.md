# @knodes/typedoc-plugin-code-blocks

> A TypeDoc plugin to embed source code into your output documentation
> 
[![npm](https://img.shields.io/npm/v/@knodes/typedoc-plugin-code-blocks?color=brightgreen)](https://www.npmjs.com/package/@knodes/typedoc-plugin-code-blocks)

## Compatibility

This plugin version should match TypeDoc `major.minor.x` for compatibility.

## Getting started

This plugin allows you to embed code files or regions into your markdown content. Those files are looked up from named directories.

### Configure

Set the `code-blocks-directories` options. This option is a map of names/paths.

Example `typedoc.json`:

```json
{
    "code-blocks-directories": {
        "src": "./src",
        "tests": "./__tests__/example"
    }
}
```

### Use

In any markdown content, you can use the `{@codeblock ...}` macro to lookup for files.

Syntax: `{@codeblock [foldable|folded] <named-directory>/<path-to-file-in-dir>[#region] [ | custom-file-name]}`

* `[foldable|folded]`: optional. If set, a `details` HTML block will be generated. If `foldable`, the `details` will be expanded by default.
* `[#region]`: A named region in the target file. Regions are started with `// #region my-name`, & ended with `// #endregion [my-name]`. Interleaved/nested regions are supported. Note that region markers are not outputted in the generated code block.
* `[ | custom-file-name]`: allow to specify an explicit file name to display in the code block header.