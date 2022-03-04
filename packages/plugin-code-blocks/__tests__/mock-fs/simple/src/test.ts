const stub = () => 1;

// #region relPath
/**
 * A test code block for relative path from file
 *
 * {@codeblock ./test.json}
 */
export const testRel = stub;
// #endregion

/**
 * A test code block for unprefixed path implicitly in `examples` directory
 *
 * {@codeblock test.json}
 */
export const testNoPrefixImplicitInExamples = stub;

/**
 * A test code block for unprefixed path in `examples` directory
 *
 * {@codeblock examples/test.json}
 */
export const testNoPrefixInExamples = stub;

// #region projPath
/**
 * A test code block for project path implicitly in `examples` directory
 *
 * {@codeblock ~~/test.json}
 */
export const testProjImplicitInExamples = stub;
// #endregion

/**
 * A test code block for project path in `examples` directory
 *
 * {@codeblock ~~/examples/test.json}
 */
export const testProjInExamples = stub;
