// #region relPath
/**
 * A test code block for relative path from file
 *
 * {@codeblock ./src-test.json}
 */
export class TestInlineRel{}
// #endregion

// #region projPath
/**
 * A test code block for module path implicitly in `examples` directory
 *
 * {@codeblock ~:example-test.json}
 */
export class TestInlineRelativeModule{}

/**
 * A test code block for project path implicitly in `examples` directory
 *
 * {@codeblock ~~:complex-regions.js#{foo,bar}}
 */
export class TestInlineExplicitProject{}
// #endregion

// #region example
/**
 * A test code block for project path implicitly in `examples` directory
 *
 * @example {@codeblock ~~:example-test.json}
 */
export class TestInlineExampleProject{}
// #endregion
