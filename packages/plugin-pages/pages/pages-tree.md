## Menus & pages

There are 2 kinds of pages nodes you can create: *menu* nodes & *page* nodes. The only difference between the 2 is that *page* nodes have a {@link IPageNode.source `source`}.

Menu, as they are not pages, are only created in your navigation sidebar, to group pages together.

## Organizing page trees

### Nested pages behavior

By default, pages with children are renamed to `{source-without-extensions}/index.html` in the output, and children are looked up from the `{source-without-extensions}` directory.

#### Example

Assuming you have the following configuration:

{@codeblock __tests__/mock-fs/simple/typedoc.js}

Here is your input/output tree:

* Getting started: `pages/getting-started.md` ⇒ `pages/getting-started/index.html`
  * Configuration: `pages/getting-started/configuration.md` ⇒ `pages/getting-started/configuration.html`
* Additional resource *(menu only)*
  * Some cool docs: `pages/additional-resources/some-cool-docs.md` ⇒ `pages/additional-resources/some-cool-docs.html`

## Monorepos

You can attach pages to monorepo modules (instead of the top-level project) by simply setting their {@link IPageNode.title `title`} to the name of your module (eg. your `package.json` `name` field).

If a {@link IPageNode.source `source`} file is specified, the content of the file is prepended to the module main page. Just look at the [*Example configuration* section here](../../modules/_knodes_typedoc_plugin_pages.html#example-configuration) !

> **BEWARE !** Behavior of monorepo nodes as children of other nodes is untested and should be considered as errors.