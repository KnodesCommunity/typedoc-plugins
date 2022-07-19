import { resolve } from 'path';

import { describeDocsFile, formatHtml, runPluginBeforeAll } from '#plugintestbed';

import { formatExpanded, simpleJson } from '../helpers';

const SRC_CODE = simpleJson( '"Foo"', '"Bar"' );
const EXAMPLE_CODE = simpleJson( '"Hello"', '"World"' );
const INLINE_CODE = simpleJson( '"hello"', '"world"' );

const rootDir = resolve( __dirname, '../mock-fs/simple' );
process.chdir( rootDir );
runPluginBeforeAll( rootDir, resolve( __dirname, '../../src/index' ), { options: { gitRemote: 'FAKE' }} );
describe( '`index.html`', describeDocsFile( rootDir, 'index.html', it => {
	it( 'should have correct content', ( content, dom ) => {
		expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

		const panel = dom.window.document.querySelector( '.col-content > .tsd-panel.tsd-typography' );
		expect( panel!.children ).toHaveLength( 5 );
		expect( panel!.children[0].outerHTML ).toEqual( '<p>Hello world</p>' );
		expect( panel!.children[1].outerHTML ).toEqual( formatExpanded( 'Test inline codeblock from relative', SRC_CODE ) );
		expect( panel!.children[2].outerHTML ).toEqual( formatExpanded( 'Test inline codeblock from project root', EXAMPLE_CODE ) );
		expect( panel!.children[3].outerHTML ).toEqual( formatExpanded( 'Test inline codeblock from module root', EXAMPLE_CODE ) );
		expect( panel!.children[4].outerHTML ).toEqual( formatExpanded( 'example-inline.json', INLINE_CODE ) );
	} );
	it( 'should have constant content', content => {
		expect( formatHtml( content ) ).toMatchSnapshot();
	} );
} ) );
describe( 'Codeblock', () => {
	describe( 'Block tag', () => {
		describe( '`classes/BlockBlock.TestBlockExplicitProject.html`', describeDocsFile( rootDir, 'classes/BlockBlock.TestBlockExplicitProject.html', it => {
			it( 'should have correct content', ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( './examples/example-test.json', EXAMPLE_CODE ) );
			} );
			it( 'should have constant content', content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} );
		} ) );
		describe( '`classes/BlockBlock.TestBlockRel.html`', describeDocsFile( rootDir, 'classes/BlockBlock.TestBlockRel.html', it => {
			it( 'should have correct content', ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( './src/codeblock/src-test.json', SRC_CODE ) );
			} );
			it( 'should have constant content', content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} );
		} ) );
		describe( '`classes/BlockBlock.TestBlockRelativeModule.html`', describeDocsFile( rootDir, 'classes/BlockBlock.TestBlockRelativeModule.html', it => {
			it( 'should have correct content', ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( './examples/example-test.json', EXAMPLE_CODE ) );
			} );
			it( 'should have constant content', content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} );
		} ) );
	} );
	describe( 'Inline tag', () => {
		describe( '`classes/BlocInline.TestInlineExplicitProject.html`', describeDocsFile( rootDir, 'classes/BlockInline.TestInlineExplicitProject.html', it => {
			it( 'should have correct content', ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( './examples/example-test.json', EXAMPLE_CODE ) );
			} );
			it( 'should have constant content', content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} );
		} ) );
		describe( '`classes/BlocInline.TestInlineRel.html`', describeDocsFile( rootDir, 'classes/BlockInline.TestInlineRel.html', it => {
			it( 'should have correct content', ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( './src/codeblock/src-test.json', SRC_CODE ) );
			} );
			it( 'should have constant content', content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} );
		} ) );
		describe( '`classes/BlocInline.TestInlineRelativeModule.html`', describeDocsFile( rootDir, 'classes/BlockInline.TestInlineRelativeModule.html', it => {
			it( 'should have correct content', ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( './examples/example-test.json', EXAMPLE_CODE ) );
			} );
			it( 'should have constant content', content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} );
		} ) );
		describe( '`classes/BlocInline.TestInlineExampleProject.html`', describeDocsFile( rootDir, 'classes/BlockInline.TestInlineExampleProject.html', it => {
			it( 'should have correct content', ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( './examples/example-test.json', EXAMPLE_CODE ) );

				const heading = dom.window.document.querySelector( '.tsd-panel > .tsd-comment > h3' );
				expect( codeblocks[0].previousElementSibling ).toBe( heading );
				expect( heading!.innerHTML ).toEqual( 'Example' );
			} );
			it( 'should have constant content', content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} );
		} ) );
	} );
} );
describe( 'Inline Codeblock', () => {
	describe( 'Block tag', () => {
		describe( '`classes/InlineBlock.TestInlineBlock.html`', describeDocsFile( rootDir, 'classes/InlineBlock.TestInlineBlock.html', it => {
			it( 'should have correct content', ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( 'test.json', INLINE_CODE ) );
			} );
			it( 'should have constant content', content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} );
		} ) );
	} );
	describe( 'Inline tag', () => {
		describe( '`classes/InlineInline.TestInlineInline.html`', describeDocsFile( rootDir, 'classes/InlineInline.TestInlineInline.html', it => {
			it( 'should have correct content', ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( 'test.json', INLINE_CODE ) );
			} );
			it( 'should have constant content', content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} );
		} ) );
		describe( '`classes/InlineInline.TestInlineExampleInline.html`', describeDocsFile( rootDir, 'classes/InlineInline.TestInlineExampleInline.html', it => {
			it( 'should have correct content', ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( 'test.json', INLINE_CODE ) );

				const heading = dom.window.document.querySelector( '.tsd-panel > .tsd-comment > h3' );
				expect( codeblocks[0].previousElementSibling ).toBe( heading );
				expect( heading!.innerHTML ).toEqual( 'Example' );
			} );
			it( 'should have constant content', content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} );
		} ) );
	} );
} );
