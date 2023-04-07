import { resolve } from '@knodes/typedoc-pluginutils/path';

import { describeDocsFile, formatHtml, runPluginBeforeAll } from '#plugintestbed';

import { matchExpanded } from '../helpers';

const SAMPLES = {
	'src-test.json': '{"Foo": "Bar"}',
	'example-test.json': '{"Hello": "World"}',
	'typescript-sample.ts': 'const x = `hello`;const y = `world`;',
	'inline.json': '{"hello": "world"}',
};

const rootDir = resolve( __dirname, '../mock-fs/simple' );
process.chdir( rootDir );
runPluginBeforeAll( rootDir, resolve( __dirname, '../../src/index' ), { options: { gitRemote: undefined }} );
describe( '`index.html`', describeDocsFile( rootDir, 'index.html', withContent => {
	it( 'should have correct content', withContent( async ( content, dom ) => {
		expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

		const panel = dom.window.document.querySelector( '.col-content > .tsd-panel.tsd-typography' );
		expect( panel!.children ).toHaveLength( 5 );
		expect( panel!.children[0].outerHTML ).toEqual( '<p>Hello world</p>' );
		expect( panel!.children[1] ).toSatisfy( matchExpanded( 'CodeBlock1.json', SAMPLES['src-test.json'] ) );
		expect( panel!.children[2] ).toSatisfy( matchExpanded( 'CodeBlock2.json', SAMPLES['example-test.json'] ) );
		expect( panel!.children[3] ).toSatisfy( matchExpanded( 'CodeBlock3.ts', SAMPLES['typescript-sample.ts'] ) );
		expect( panel!.children[4] ).toSatisfy( matchExpanded( 'InlineCodeBlock4.json', SAMPLES['inline.json'] ) );
	} ) );
	it( 'should have constant content', withContent( content => {
		expect( formatHtml( content ) ).toMatchSnapshot();
	} ) );
} ) );
describe( 'Codeblock', () => {
	describe( 'Block tag', () => {
		describe( '`classes/BlockBlock.TestBlockExplicitProject.html`', describeDocsFile( rootDir, 'classes/BlockBlock.TestBlockExplicitProject.html', withContent => {
			it( 'should have correct content', withContent( ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0] ).toSatisfy( matchExpanded( './examples/typescript-sample.ts#1~4', SAMPLES['typescript-sample.ts'] ) );
			} ) );
			it( 'should have constant content', withContent( content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} ) );
		} ) );
		describe( '`classes/BlockBlock.TestBlockRel.html`', describeDocsFile( rootDir, 'classes/BlockBlock.TestBlockRel.html', withContent => {
			it( 'should have correct content', withContent( ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0] ).toSatisfy( matchExpanded( './src/codeblock/src-test.json', SAMPLES['src-test.json'] ) );
			} ) );
			it( 'should have constant content', withContent( content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} ) );
		} ) );
		describe( '`classes/BlockBlock.TestBlockRelativeModule.html`', describeDocsFile( rootDir, 'classes/BlockBlock.TestBlockRelativeModule.html', withContent => {
			it( 'should have correct content', withContent( ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0] ).toSatisfy( matchExpanded( './examples/example-test.json', SAMPLES['example-test.json'] ) );
			} ) );
			it( 'should have constant content', withContent( content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} ) );
		} ) );
	} );
	describe( 'Inline tag', () => {
		describe( '`classes/BlocInline.TestInlineExplicitProject.html`', describeDocsFile( rootDir, 'classes/BlockInline.TestInlineExplicitProject.html', withContent => {
			it( 'should have correct content', withContent( ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0] ).toSatisfy( matchExpanded( './examples/complex-regions.js#1~8', "const foo = 'FOO'// ...const bar = 'BAR'" ) );
			} ) );
			it( 'should have constant content', withContent( content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} ) );
		} ) );
		describe( '`classes/BlocInline.TestInlineRel.html`', describeDocsFile( rootDir, 'classes/BlockInline.TestInlineRel.html', withContent => {
			it( 'should have correct content', withContent( ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0] ).toSatisfy( matchExpanded( './src/codeblock/src-test.json', SAMPLES['src-test.json'] ) );
			} ) );
			it( 'should have constant content', withContent( content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} ) );
		} ) );
		describe( '`classes/BlocInline.TestInlineRelativeModule.html`', describeDocsFile( rootDir, 'classes/BlockInline.TestInlineRelativeModule.html', withContent => {
			it( 'should have correct content', withContent( ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0] ).toSatisfy( matchExpanded( './examples/example-test.json', SAMPLES['example-test.json'] ) );
			} ) );
			it( 'should have constant content', withContent( content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} ) );
		} ) );
		describe( '`classes/BlocInline.TestInlineExampleProject.html`', describeDocsFile( rootDir, 'classes/BlockInline.TestInlineExampleProject.html', withContent => {
			it( 'should have correct content', withContent( ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0] ).toSatisfy( matchExpanded( './examples/example-test.json', SAMPLES['example-test.json'] ) );

				const heading = dom.window.document.querySelector( '.tsd-panel > .tsd-comment > h3' );
				expect( codeblocks[0].previousElementSibling ).toBe( heading );
				expect( heading!.innerHTML ).toEqual( 'Example' );
			} ) );
			it( 'should have constant content', withContent( content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} ) );
		} ) );
	} );
} );
describe( 'Inline Codeblock', () => {
	describe( 'Block tag', () => {
		describe( '`classes/InlineBlock.TestInlineBlock.html`', describeDocsFile( rootDir, 'classes/InlineBlock.TestInlineBlock.html', withContent => {
			it( 'should have correct content', withContent( ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0] ).toSatisfy( matchExpanded( 'test.json', SAMPLES['inline.json'] ) );
			} ) );
			it( 'should have constant content', withContent( content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} ) );
		} ) );
	} );
	describe( 'Inline tag', () => {
		describe( '`classes/InlineInline.TestInlineInline.html`', describeDocsFile( rootDir, 'classes/InlineInline.TestInlineInline.html', withContent => {
			it( 'should have correct content', withContent( ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0] ).toSatisfy( matchExpanded( 'test.json', SAMPLES['inline.json'] ) );
			} ) );
			it( 'should have constant content', withContent( content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} ) );
		} ) );
		describe( '`classes/InlineInline.TestInlineExampleInline.html`', describeDocsFile( rootDir, 'classes/InlineInline.TestInlineExampleInline.html', withContent => {
			it( 'should have correct content', withContent( ( content, dom ) => {
				expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

				const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
				expect( codeblocks ).toHaveLength( 1 );
				expect( codeblocks[0] ).toSatisfy( matchExpanded( 'test.json', SAMPLES['inline.json'] ) );

				const heading = dom.window.document.querySelector( '.tsd-panel > .tsd-comment > h3' );
				expect( codeblocks[0].previousElementSibling ).toBe( heading );
				expect( heading!.innerHTML ).toEqual( 'Example' );
			} ) );
			it( 'should have constant content', withContent( content => {
				expect( formatHtml( content ) ).toMatchSnapshot();
			} ) );
		} ) );
	} );
} );
