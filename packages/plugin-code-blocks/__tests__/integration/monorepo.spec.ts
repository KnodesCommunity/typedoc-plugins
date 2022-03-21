import { resolve } from 'path';

import { JSDOM } from 'jsdom';

import { checkDocsFile, formatHtml, runPluginBeforeAll } from '#plugintestbed';

import { checkDef, formatExpanded } from '../helpers';

const rootDir = resolve( __dirname, '../mock-fs/monorepo' );
process.chdir( rootDir );
runPluginBeforeAll( rootDir, resolve( __dirname, '../../src/index' ) );
describe( 'Code block', () => {
	const testJson = '<pre><code class="language-json">'+
	'<span class="hl-0">{</span><span class="hl-1">"Hello"</span><span class="hl-0">: </span><span class="hl-2">"World"</span><span class="hl-0">}</span>\n'+
	'</code></pre>';
	const testJsonA = testJson.replace( 'Hello', 'pkg' ).replace( 'World', 'a' );
	const testJsonB = testJson.replace( 'Hello', 'pkg' ).replace( 'World', 'b' );
	it( '`modules/pkg_a.html` should have correct contents', checkDocsFile( rootDir, 'modules/pkg_a.html', c => {
		const dom = new JSDOM( c );
		checkDef( dom, 'testInProjA', formatExpanded( './packages/a/examples/test.json', testJsonA ) );
		checkDef( dom, 'testInProjB', formatExpanded( './packages/b/examples/test.json', testJsonB ) );
		checkDef( dom, 'testNoPrefixImplicitInExamples', formatExpanded( './packages/a/examples/test.json', testJsonA ) );
		checkDef( dom, 'testNoPrefixInExamples', formatExpanded( './packages/a/examples/test.json', testJsonA ) );
		expect( c ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
	it( '`modules/pkg_b.html` should have correct contents', checkDocsFile( rootDir, 'modules/pkg_b.html', c => {
		const dom = new JSDOM( c );
		checkDef( dom, 'testInProjA', formatExpanded( './packages/a/examples/test.json', testJsonA ) );
		checkDef( dom, 'testInProjB', formatExpanded( './packages/b/examples/test.json', testJsonB ) );
		checkDef( dom, 'testNoPrefixImplicitInExamples', formatExpanded( './packages/b/examples/test.json', testJsonB ) );
		checkDef( dom, 'testNoPrefixInExamples', formatExpanded( './packages/b/examples/test.json', testJsonB ) );
		expect( c ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
