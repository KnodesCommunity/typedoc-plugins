import { resolve } from 'path';

import { JSDOM } from 'jsdom';

import { checkDocsFile, formatHtml, runPluginBeforeAll } from '#plugintestbed';

const rootDir = resolve( __dirname, '../mock-fs/simple' );
process.chdir( rootDir );
runPluginBeforeAll( rootDir, resolve( __dirname, '../../src/index' ) );
describe( 'Root module', () => {
	it( '`index.html` should be correct', checkDocsFile( rootDir, 'index.html', c => {
		const dom = new JSDOM( c );
		const heading = dom.window.document.querySelectorAll( '.tsd-panel h1' );
		expect( heading ).toHaveLength( 1 );
		expect( heading[0] ).toHaveTextContent( 'Root readme' );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
describe( 'packages/a module', () => {
	it( '`modules/_example_package_a.html` should be correct', checkDocsFile( rootDir, 'modules/_example_package_a.html', c => {
		const dom = new JSDOM( c );
		const heading = dom.window.document.querySelectorAll( '.tsd-panel h1' );
		expect( heading ).toHaveLength( 1 );
		expect( heading[0] ).toHaveTextContent( 'Readme of A' );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
describe( 'packages/b module', () => {
	it( '`modules/_example_package_b.html` should be correct', checkDocsFile( rootDir, 'modules/_example_package_b.html', c => {
		const dom = new JSDOM( c );
		const heading = dom.window.document.querySelectorAll( '.tsd-panel h1' );
		expect( heading ).toHaveLength( 1 );
		expect( heading[0] ).toHaveTextContent( 'Readme of B' );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
