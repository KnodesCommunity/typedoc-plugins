---
name: Using the "declarative" legacy loader
---

> This loader was the only available in version `<=0.23.1`. If you don't specify a loader explicitly, the *declarative* loader is assumed.
>
> Note that I strongly encourage setting the loader explicitly, and avoid using the *declarative* loader (which has only rare use cases, like in combination with {@page ./3-template the "*template*" loader}).

See the type definition of the {@link DeclarativeNodeLoader.IRawNode DeclarativeNodeLoader.IRawNode}.

---

## Menus & pages

There are 2 kinds of *nodes* you can create: *menu* nodes & *page* nodes. The only difference between the 2 is that *page* nodes have a {@link DeclarativeNodeLoader.IRawNode `source`}.

Menu are only created in your navigation sidebar, to group *pages* together.

## Organizing page trees

By default, *pages* with children are renamed to `{source-without-extensions}/index.html` in the output, and children are looked up from the `{source-without-extensions}` directory.

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

You can attach *pages* to monorepo modules (instead of the top-level project) by setting {@link DeclarativeNodeLoader.IRawNode.moduleRoot `moduleRoot`} to true, and making sure their {@link DeclarativeNodeLoader.IRawNode.name `name`} is the name of your module (eg. your `package.json` `name` field). If the *node* is a *page* (eg. it has a {@link DeclarativeNodeLoader.IRawNode.source `source`}), the content of the file is appended to the module index, like a README.

> Only a single *page* with {@link DeclarativeNodeLoader.IRawNode.moduleRoot `moduleRoot`} is allowed per module. They can have a page and multiple menus.

#### Example

{@codeblock monorepo/typedoc.js}
