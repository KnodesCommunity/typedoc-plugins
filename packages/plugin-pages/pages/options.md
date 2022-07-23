## Providing options

See {@page ~@knodes/typedoc-pluginutils/providing-options.md} to know more about how you can pass options.

Options are prefixed with `pluginPages`.

You can also use the *TypeDoc* CLI to get all available options.

```sh
typedoc --help
```

## Complete list of options

* `pages`: The pages definition. Checkout {@page ./pages-tree.md} for more infos on how to set this.\
  Type: {@link IPageNode `IPageNode[]`}
* `enablePageLinks`: Whether or not {@page ...} tags should be parsed.\
  Type: `boolean`\
  Default: `true`
* `enableSearch`: Whether or not the pages should be added to the search index.\
  Type: `boolean`\
  Default: `true`
* `searchBoost`: The score multiplier for pages in search.\
  Type: `number`\
  Default: `10`
* `invalidPageLinkHandling`: The kind of error to throw in case of an invalid page link.\
  Type: {@link EInvalidPageLinkHandling `EInvalidPageLinkHandling`}\
  Default: {@link EInvalidPageLinkHandling.LOG_ERROR `EInvalidPageLinkHandling.LOG_ERROR`}
* `output`: Output directory where your pages will be rendered.\
  Type: `string`\
  Default: `'pages'`
* `source`: Root directory where all page source files live.\
  Type: `string`\
  Default: `'pages'`
* `logLevel`: The plugin log level.\
  Type: `LogLevel`\
  Default to the application log level.
* `excludeMarkdownTags`: A list of markdown captures to omit. Should have the form `{@....}`.\
  Type: `string[]`

> See {@link IPluginOptions}