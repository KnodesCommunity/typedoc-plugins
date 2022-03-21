import { resolve } from 'path';

import { JSDOM } from 'jsdom';

import { checkDocsFile, formatHtml, runPluginBeforeAll } from '#plugintestbed';

import { checkDef, formatExpanded } from '../helpers';

const rootDir = resolve( __dirname, '../mock-fs/simple' );
process.chdir( rootDir );
runPluginBeforeAll( rootDir, resolve( __dirname, '../../src/index' ) );
describe( 'Code block', () => {
	it( '`modules.html` should have correct contents', checkDocsFile( rootDir, 'modules.html', c => {
		const dom = new JSDOM( c );
		const testJson = '<pre><code class="language-json">'+
		'<span class="hl-0">{</span><span class="hl-1">"Hello"</span><span class="hl-0">: </span><span class="hl-2">"World"</span><span class="hl-0">}</span>\n'+
		'</code></pre>';
		const testJsonFooBar = testJson.replace( 'Hello', 'Foo' ).replace( 'World', 'Bar' );
		checkDef( dom, 'testProjImplicitInExamples', formatExpanded( './examples/test.json', testJson ) );
		checkDef( dom, 'testProjInExamples', formatExpanded( './examples/test.json', testJson ) );
		checkDef( dom, 'testNoPrefixImplicitInExamples', formatExpanded( './examples/test.json', testJson ) );
		checkDef( dom, 'testNoPrefixInExamples', formatExpanded( './examples/test.json', testJson ) );
		checkDef( dom, 'testRel', formatExpanded( './src/test.json', testJsonFooBar ) );
		expect( c ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
