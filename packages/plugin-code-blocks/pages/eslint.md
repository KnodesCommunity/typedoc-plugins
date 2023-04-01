While we recommend using `@codeblock` & `@inlineCodeblock` as *inline tags* (eg. `{@codeblock ...}` in any markdown content), you can also use it as block tags defined in your *Typedoc* comments.

Example:
{@codeblock simple/src/codeblock/block.ts#relPath}

If you're using [`eslint-plugin-jsdoc`](https://www.npmjs.com/package/eslint-plugin-jsdoc), you might need to customize the `check-tag-names` rule like so:

{@codeblock ../.eslintrc.js#jsdoc-config}
