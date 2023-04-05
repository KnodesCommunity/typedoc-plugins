import { resolve } from '@knodes/typedoc-pluginutils/path';

import { describeDocsFile, formatHtml, runPluginBeforeAll } from '#plugintestbed';

const rootDir = resolve( __dirname, '../mock-fs/simple' );
process.chdir( rootDir );
runPluginBeforeAll( rootDir, resolve( __dirname, '../../src/index' ) );
describe( 'Root `index.html`', describeDocsFile( rootDir, 'index.html', withContent => {
	it( 'should have correct content', withContent( ( content, dom ) => {
		const heading = dom.window.document.querySelectorAll( '.tsd-panel h1' );
		expect( heading ).toHaveLength( 1 );
		expect( heading[0] ).toHaveTextContent( 'Root readme' );
		expect( formatHtml( content ) ).toMatchSnapshot();
	} ) );
} ) );
describe( 'packages/a module`', describeDocsFile( rootDir, 'modules/_example_package_a.html', withContent => {
	it.failing( 'should have correct content', withContent( ( content, dom ) => {
		const heading = dom.window.document.querySelectorAll( '.tsd-panel h1' );
		expect( heading ).toHaveLength( 1 );
		expect( heading[0] ).toHaveTextContent( 'Readme of A' );
		expect( formatHtml( content ) ).toMatchSnapshot();
	} ) );
} ) );
describe( 'packages/b module`', describeDocsFile( rootDir, 'modules/_example_package_b.html', withContent => {
	it.failing( 'should have correct content', withContent( ( content, dom ) => {
		const heading = dom.window.document.querySelectorAll( '.tsd-panel h1' );
		expect( heading ).toHaveLength( 1 );
		expect( heading[0] ).toHaveTextContent( 'Readme of B' );
		expect( formatHtml( content ) ).toMatchSnapshot();
	} ) );
} ) );
