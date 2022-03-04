## Examples

### Resolve from current file

Simply pass a path with a `.` prefix, like `./test.spec.ts` or `../other-source.ts`

{@codeblock simple/src/test.ts#relPath}

### Resolve from project root

You can use the `~~/` prefix to start searching from the project root.

{@codeblock simple/src/test.ts#projPath}

### Resolve from another package root (monorepo)

For monorepo, you can also use the `~{packagename}/` prefix to start searching from the given project root. The package name is the `name` property in your `package.json`

{@codeblock monorepo/packages/a/src/index.ts#inExplicitPackage}