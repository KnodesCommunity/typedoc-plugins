## Menus & pages

There are 2 kinds of pages nodes you can create: *menu* nodes & *page* nodes. The only difference between the 2 is that *page* nodes have a {@link IPageNode.source `source`}.

Menu, as they are not pages, are only created in your navigation sidebar, to group pages together.

## Organizing page trees

By default, pages with children are renamed to `{source-without-extensions}/index.html` in the output, and children are looked up from the `{source-without-extensions}` directory.

### Single package

#### Example

Assuming you have the following configuration:

{@codeblock simple/typedoc.js}

Here is your input/output tree:

* Getting started: `pages/getting-started.md` ⇒ `pages/getting-started/index.html`
  * Configuration: `pages/getting-started/configuration.md` ⇒ `pages/getting-started/configuration.html`
* Additional resource *(menu only)*
  * Some cool docs: `pages/additional-resources/some-cool-docs.md` ⇒ `pages/additional-resources/some-cool-docs.html`

### Monorepos

You can attach pages to monorepo modules (instead of the top-level project) by setting {@link IRootPageNode.moduleRoot `moduleRoot`} to true, and making sure their {@link IPageNode.name `name`} is the name of your module (eg. your `package.json` `name` field).

#### Example

{@codeblock monorepo/typedoc.js}

### The `moduleRoot` flag

This flag must be set on **all** or **none** of the top-level *page*/*menu*. If the `moduleRoot` is a *page*, the {@link IPageNode.source `source`} is prepended to the module index, pretty much like a README.