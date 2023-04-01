Options can be set in the following ways:

* inline (for CLI), as a JSON object (wrapped with `{` & `}`)

  ```bash
  typedoc --<pluginOptionsPrefix> '{"source": "my-source"}'
  ```

* as a path to a configuration file exporting options (`require`able files are supported, so, by default, `.json` & `.js`)

  ```bash
  typedoc --<pluginOptionsPrefix> plugin-configuration.json
  ```

  {@inlineCodeblock typedoc.json

  ```json
  {
      // ...
      "<pluginOptionsPrefix>": "plugin-configuration.json"
  }
  ```}

* as individual options (prefixed with `<pluginOptionsPrefix>:`)

  ```bash
  typedoc --<pluginOptionsPrefix>:<optionName> <optionValue>
  ```

  {@inlineCodeblock typedoc.json

  ```json
  {
      // ...
      "<pluginOptionsPrefix>:<optionName>": "<optionValue>"
  }
  ```}

* or as an object (for config file only)

  {@inlineCodeblock typedoc.json

  ```json
  {
      // ...
      "<pluginOptionsPrefix>": {
          "<optionName>": "<optionValue>"
      }
  }
  ```}
