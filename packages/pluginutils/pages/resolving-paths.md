## Some terminology:

* A **container folder** is a well-known directory where all targets are expected to be. For example, it can be a directory containing all extra markdown pages or examples you want to put in your documentation. Each *workspace* can have its own *container folder*.
* A **workspace** is a top-level entry in your project. There is always at least a **root workspace**\
  In addition to the *root workspace*, each packages is considered a workspace in a **monorepo**, named as the package's `name` defined in `package.json`.\

## How resolution works

* **Relative paths (starting with `./` or `../`)**: Targets are **not** searched in *container folders*, but relative to the current file.
* **Current module paths (starting with `~:` or without `~...:` prefix)**: Targets are searched in the *container folder* of the current *workspace*.
* **Explicit module paths (starting with `~<workspace-name>:`)**: Targets are searched in the *container folder* of the *workspace* with the given name.
* **Root paths (starting with `~~:`)**: Targets are searched in the *container folder* of the *root workspace*.

See {@link NamedPath} for the type definition.