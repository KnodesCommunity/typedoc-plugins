// #region relPath
/**
 * A test code block for relative path from file
 *
 * @codeblock ./src-test.json
 */
export class TestBlockRel{}
// #endregion

// #region projPath
/**
 * A test code block for module path implicitly in `examples` directory
 *
 * @codeblock ~:example-test.json
 */
export class TestBlockRelativeModule{}

/**
 * A test code block for project path implicitly in `examples` directory
 *
 * @codeblock ~~:typescript-sample.ts#test
 */
export class TestBlockExplicitProject{}
// #endregion
