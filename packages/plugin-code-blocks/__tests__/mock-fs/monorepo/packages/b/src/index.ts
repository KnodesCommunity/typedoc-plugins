const stub = () => 1;

// #region inExplicitPackage
/**
 * A test code block targetting project A
 *
 * {@codeblock ~pkg-a/test.json}
 */
export const testInProjA = stub;

/**
 * A test code block targetting project B
 *
 * {@codeblock ~pkg-b/test.json}
 */
export const testInProjB = stub;
// #endregion

// #region inPackage
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
// #endregion
