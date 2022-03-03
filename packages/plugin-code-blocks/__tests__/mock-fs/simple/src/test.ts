const stub = () => 1;

// #region relPath
/**
 * A test code block for relative path from file
 *
 * {@codeblock ./test.json}
 */
export const testRel = stub;
// #endregion

// #region projPath
/**
 * A test code block for unprefixed path implicitly in blocks directory
 *
 * {@codeblock test.json}
 */
export const testNoPrefixImplicitInBlocks = stub;

/**
 * A test code block for unprefixed path in blocks directory
 *
 * {@codeblock blocks/test.json}
 */
export const testNoPrefixInBlocks = stub;

/**
 * A test code block for project path in blocks directory
 *
 * {@codeblock ~~/blocks/test.json}
 */
export const testProjInBlocks = stub;

/**
 * A test code block for project path implicitly in blocks directory
 *
 * {@codeblock ~~/test.json}
 */
export const testProjImplicitInBlocks = stub;
// #endregion
