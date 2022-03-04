import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { JSDOM } from 'jsdom';

import { formatHtml, runPlugin } from '@knodes/typedoc-plugintestbed';

import { checkDef, formatExpanded } from '../helpers';

const rootDir = resolve( __dirname, '../mock-fs/monorepo' );
jest.setTimeout( process.env.CI === 'true' ? 60000 : 30000 );
beforeEach( () => {
	process.chdir( rootDir );
} );
describe( 'Real behavior', () => {
	it( 'should render correctly', async () => {
		await runPlugin( rootDir, resolve( __dirname, '../../src/index' ) );
		const testJson = '<pre><code class="language-json">'+
		'<span class="hl-0">{</span><span class="hl-1">"Hello"</span><span class="hl-0">: </span><span class="hl-2">"World"</span><span class="hl-0">}</span>\n'+
		'</code></pre>';
		const testJsonA = testJson.replace( 'Hello', 'pkg' ).replace( 'World', 'a' );
		const testJsonB = testJson.replace( 'Hello', 'pkg' ).replace( 'World', 'b' );

		const pkgA = await readFile( resolve( rootDir, 'docs/modules/pkg_a.html' ), 'utf-8' );
		const domA = new JSDOM( pkgA );
		checkDef( domA, 'testInProjA', formatExpanded( './packages/a/examples/test.json', testJsonA ) );
		checkDef( domA, 'testInProjB', formatExpanded( './packages/b/examples/test.json', testJsonB ) );
		checkDef( domA, 'testNoPrefixImplicitInExamples', formatExpanded( './packages/a/examples/test.json', testJsonA ) );
		checkDef( domA, 'testNoPrefixInExamples', formatExpanded( './packages/a/examples/test.json', testJsonA ) );
		expect( pkgA ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );
		expect( formatHtml( pkgA ) ).toMatchSnapshot();

		const pkgB = await readFile( resolve( rootDir, 'docs/modules/pkg_b.html' ), 'utf-8' );
		const domB = new JSDOM( pkgB );
		checkDef( domB, 'testInProjA', formatExpanded( './packages/a/examples/test.json', testJsonA ) );
		checkDef( domB, 'testInProjB', formatExpanded( './packages/b/examples/test.json', testJsonB ) );
		checkDef( domB, 'testNoPrefixImplicitInExamples', formatExpanded( './packages/b/examples/test.json', testJsonB ) );
		checkDef( domB, 'testNoPrefixInExamples', formatExpanded( './packages/b/examples/test.json', testJsonB ) );
		expect( pkgB ).toMatch( /<link\s+rel="stylesheet"\s+href="([^"]*?\/)?assets\/code-blocks\.css"\s*\/>/ );
		expect( formatHtml( pkgB ) ).toMatchSnapshot();
	} );
} );
