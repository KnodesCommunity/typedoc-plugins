## Providing options

See {@page ~@knodes/typedoc-pluginutils:providing-options} to know more about how you can pass options.

Options are prefixed with `pluginPages`.

You can also use the *TypeDoc* CLI to get all available options.

```sh
typedoc --help
```

## Complete list of options

* `pages`: The pages definition. Checkout {@page ./pages-tree} for more infos on how to set this.\
  Type: {@link AnyLoaderRawPageNode `AnyLoaderRawPageNode[]`}
* `enablePageLinks`: Whether or not `{@page ...}` tag should be parsed.\
  Type: `boolean`\
  Default: `true`
* `enableSearch`: Whether or not the pages should be added to the search index.\
  Type: `boolean`\
  Default: `true`
* `invalidPageLinkHandling`: The kind of error to throw in case of an invalid page link.\
  Type: {@link EInvalidPageLinkHandling `EInvalidPageLinkHandling`}\
  Default: {@link EInvalidPageLinkHandling.LOG_ERROR `EInvalidPageLinkHandling.LOG_ERROR`}
* `output`: Output directory where your pages will be rendered.\
  Type: `string`\
  Default: `'pages'`
* `logLevel`: The plugin log level.\
  Type: `LogLevel`\
  Default to the application log level.
* `excludeMarkdownTags`: A list of markdown captures to omit. Should have the form `{@....}`.\
  Type: `string[]`
* `linkModuleBase`: The container in packages to search for pages in "{@link ...}" tags.\
  Type: `string | null`

  > **Note**: prefer setting this option to `null` and use `linkModuleBase` in order to anticipate a future removal of this option.

> See {@link IPluginOptions}
