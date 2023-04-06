While **only** `{@codeblock}` & `{@inlineCodeblock}` _inline tags_ works in _Markdown_ files, you can also use them as _block tags_ (`@codeblock` & `@inlineCodeblock`, without curly braces) in your _Typedoc comments_.

Example:
{@codeblock simple/src/codeblock/block.ts#relPath}

If you're using [`eslint-plugin-jsdoc`](https://www.npmjs.com/package/eslint-plugin-jsdoc), you might need to customize the `check-tag-names` rule like so:

{@codeblock ../.eslintrc.js#jsdoc-config}
