## Providing options

See {@page ~@knodes/typedoc-pluginutils:providing-options} to know more about how you can pass options.

Options are prefixed with `pluginCodeBlocks`.

You can also use the *TypeDoc* CLI to get all available options.

```sh
typedoc --help
```

## Complete list of options

* `invalidBlockLinkHandling`: The kind of error to throw in case of an invalid code block reference.\
  Type: {@link EInvalidBlockLinkHandling `EInvalidBlockLinkHandling`}\
  Default: {@link EInvalidBlockLinkHandling.LOG_ERROR `EInvalidBlockLinkHandling.LOG_ERROR`}
* `defaultBlockMode`: The default mode for blocks.\
  Type: {@link EBlockMode `EBlockMode`}\
  Default: {@link EBlockMode.EXPANDED `EBlockMode.EXPANDED`}
* `source`: Root directory where all code blocks live.\
  Type: `string`\
  Default: `'examples'`
* `logLevel`: The plugin log level.\
  Type: `LogLevel`\
  Default to the application log level.
* `excludeMarkdownTags`: A list of markdown captures to omit. Should have the form `{@....}`.\
  Type: `string[]`

> See {@link IPluginOptions}