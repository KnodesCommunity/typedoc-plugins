---
name: Using the "frontMatter" loader
---

See the type definition of the {@link FrontMatterNodeLoader.IRawNode FrontMatterNodeLoader.IRawNode}.

---

The front-matter loader is the recommended way to write your _pages_. It is almost 0-config: just indicate the folder in which _nodes_ are expected to live in within each package, and write them; that's all !

Pages consists in 2 main components in a `.md` file:

* the _matter_, containing attributes such as the page name (more options later), in _YAML_ format, between `---` markers
* and the _body_, containing your page markup, in _markdown_ format

@codeblock ../../__tests__/mock-fs/monorepo/packages/c/pages-front-matter/a-sample-page.md

If you want to create _menu_-only _nodes_, create `.yaml` files instead.

> In the future, options formats other than YAML might be supported, along with other markup languages or extensions to markdown. I'm heavily inspired by [the _Hugo_ static CMS](https://gohugo.io/) & [_MDX_ features used by Bit, among others](https://mdxjs.com/), and I would really love to allow you to use such things to write awesome documentation, reuse some component styles, and make reading & writing documentation more enjoyable.

## Example

Assuming you have the following files:

* configuration/
  * index.yaml

    ```yaml
    name: 'Available configuration`
    ```

  * instance-options.md

    ```md
    ---
    name: 'Instance options'
    ---
    ... Some content
    ```

  * global-options.md

    ```md
    ... Some content
    ```

* examples/
  * index.md

    ```md
    Here are some examples
    ```

This would result in the following _pages_ tree:

* Available configuration (_menu_)
  * Instance options (_page_)
  * Global options (_page_, title infered from file name)
* Examples (_page_)
