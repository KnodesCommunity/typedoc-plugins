## Providing options

See {@page ~@knodes/typedoc-pluginutils:providing-options.md} to know more about how you can pass options.

Options are prefixed with `pluginMonorepoReadmes`.

You can also use the *TypeDoc* CLI to get all available options.

```sh
typedoc --help
```

## Complete list of options

* `rootFiles`: A list of file names used to infer packages root. This is case sensitive.\
  Type: `string[]`\
  Default: `["package.json"]`
* `logLevel`: The plugin log level.\
  Type: `LogLevel`\
  Default to the application log level.
* `readme`: The name of the readme files. This is case insensitive.\
  Type: `string[]`\
  Default: `['README.md']`

> See {@link IPluginOptions}
