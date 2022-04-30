## Providing options

See {@page ~@knodes/typedoc-pluginutils/providing-options.md} to know more about how you can pass options.

Options are prefixed with `pluginMonorepoReadmes`.

You can also use the *TypeDoc* CLI to get all available options.

```sh
typedoc --help
```

## Complete list of options

* `rootFiles`: A list of file names used to infer packages root.\
  Type: `string[]`\
  Default: `["package.json"]`
* `logLevel`: The plugin log level.\
  Type: `LogLevel`\
  Default to the application log level.

> See {@link IPluginOptions}