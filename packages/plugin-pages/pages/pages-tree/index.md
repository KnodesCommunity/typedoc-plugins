---
name: Managing pages & menu items
---

## Menus & pages

There are 2 kinds of pages nodes you can create: *menu* nodes & *page* nodes.

## Organizing page trees

By default, pages with children are renamed to `{source-without-extensions}/index.html` in the output, and children are looked up from the `{source-without-extensions}` directory.

### Single package

#### Example

Assuming you have the following configuration:

{@codeblock simple/typedoc.js#config-*}

Here is your input/output tree:

* Getting started: `pages/getting-started.md` ⇒ `pages/getting-started/index.html`
  * Configuration: `pages/getting-started/configuration.md` ⇒ `pages/getting-started/configuration.html`
* Additional resource *(menu only)*
  * Some cool docs: `pages/additional-resources/some-cool-docs.md` ⇒ `pages/additional-resources/some-cool-docs.html`

### Monorepos

{@codeblock monorepo/typedoc.js}
