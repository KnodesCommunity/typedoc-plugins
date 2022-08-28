import { resolve } from 'path';

import { describeDocsFile, formatHtml, runPluginBeforeAll } from '#plugintestbed';

import { formatExpanded, simpleJson } from '../helpers';

const PKG_A = simpleJson( '"pkg"', '"a"' );
const PKG_B = simpleJson( '"pkg"', '"b"' );
const PKG_ROOT = simpleJson( '"pkg"', '"~~"' );
const PKGS = { a: PKG_A, b: PKG_B };

const rootDir = resolve( __dirname, '../mock-fs/monorepo' );
process.chdir( rootDir );
runPluginBeforeAll( rootDir, resolve( __dirname, '../../src/index' ), { options: { gitRemote: undefined }} );
describe.each( [ 'a', 'b' ] )( 'Pkg %s', pkg => {
	describe( `\`classes/pkg_${pkg}.TestNoPrefixExamples.html\``, describeDocsFile( rootDir, `classes/pkg_${pkg}.TestNoPrefixExamples.html`, it => {
		it( 'should have correct content', ( content, dom ) => {
			expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

			const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
			expect( codeblocks ).toHaveLength( 1 );
			expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( `./packages/${pkg}/examples/test.json`, PKGS[pkg as keyof typeof PKGS] ) );
		} );
		it( 'should have constant content', content => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
	describe( `\`classes/pkg_${pkg}.TestInModuleExamples.html\``, describeDocsFile( rootDir, `classes/pkg_${pkg}.TestInModuleExamples.html`, it => {
		it( 'should have correct content', ( content, dom ) => {
			expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

			const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
			expect( codeblocks ).toHaveLength( 1 );
			expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( `./packages/${pkg}/examples/test.json`, PKGS[pkg as keyof typeof PKGS] ) );
		} );
		it( 'should have constant content', content => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
	describe( `\`classes/pkg_${pkg}.TestInProjA.html\``, describeDocsFile( rootDir, `classes/pkg_${pkg}.TestInProjA.html`, it => {
		it( 'should have correct content', ( content, dom ) => {
			expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

			const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
			expect( codeblocks ).toHaveLength( 1 );
			expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( './packages/a/examples/test.json', PKG_A ) );
		} );
		it( 'should have constant content', content => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
	describe( `\`classes/pkg_${pkg}.TestInProjB.html\``, describeDocsFile( rootDir, `classes/pkg_${pkg}.TestInProjB.html`, it => {
		it( 'should have correct content', ( content, dom ) => {
			expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

			const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
			expect( codeblocks ).toHaveLength( 1 );
			expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( './packages/b/examples/test.json', PKG_B ) );
		} );
		it( 'should have constant content', content => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
	describe( `\`classes/pkg_${pkg}.TestInProjRoot.html\``, describeDocsFile( rootDir, `classes/pkg_${pkg}.TestInProjRoot.html`, it => {
		it( 'should have correct content', ( content, dom ) => {
			expect( content ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );

			const codeblocks = dom.window.document.querySelectorAll( '.code-block' );
			expect( codeblocks ).toHaveLength( 1 );
			expect( codeblocks[0].outerHTML ).toEqual( formatExpanded( './examples/test.json', PKG_ROOT ) );
		} );
		it( 'should have constant content', content => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
} );
