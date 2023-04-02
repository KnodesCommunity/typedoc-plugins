---
name: Using the "template" loader
---

> This loader is expected to be used along with {@page ./2-declarative the "_declarative_" loader}.

See the type definition of the {@link TemplateNodeLoader.IRawNode TemplateNodeLoader.IRawNode}.

---

The template loader tries to match files from each modules (unless filtered with the `modules` option). On each match, it expands the template to generate _pages_ & _menus_.

A typical use case of this loader is to append the changelog in your documentation:

@codeblock ../../../../typedoc.js#pagesConfig-3

## Using the JSON-compatible notation

If your typedoc configuration is a pure JSON file, you can use the JSON-compatible notation in place of the factory notation shown above. The JSON notation interpolates strings using [_lodash_ templates](https://lodash.com/docs/4.17.15#template). The example above is the same than the following:

@inlineCodeblock typedoc.json

```json
   { "loader": "template", "match": "CHANGELOG.md", "template":
    { "moduleRoot": true, "name": "${match.module.name}", "children": [
     { "name": "Changelog", "source": "${match.fullPath}" },
    ] }},
```

Within a _lodash_ template, you can use all _lodash_ methods, and a couple of utilities from `node:path`.

> Check-out {@link TemplateNodeLoader.ITemplateContext} to see all available functions.

## The `match` object

> See the type definition of the {@link TemplateNodeLoader.ITemplateMatch}.

On every file in every modules where the `match` glob matched a file, the template (object(s) or function) is expanded by passing a {@link TemplateNodeLoader.ITemplateMatch} object. You can use this object to dynamically create the page title, ancestors, or other template matches.
