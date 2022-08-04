// #region inExplicitPackage
/**
 * A test code block targetting project A
 *
 * {@codeblock ~pkg-a:test.json}
 */
export class TestInProjA{}

/**
 * A test code block targetting project B
 *
 * {@codeblock ~pkg-b:test.json}
 */
export class TestInProjB{}

/**
 * A test code block targetting root examples
 *
 * {@codeblock ~~:test.json}
 */
export class TestInProjRoot{}
// #endregion

// #region inPackage
/**
 * A test code block for unprefixed path implicitly in `examples` directory
 *
 * {@codeblock test.json}
 */
export class TestNoPrefixExamples{}

/**
 * A test code block for unprefixed path implicitly in `examples` directory
 *
 * {@codeblock ~:test.json}
 */
export class TestInModuleExamples{}
// #endregion

