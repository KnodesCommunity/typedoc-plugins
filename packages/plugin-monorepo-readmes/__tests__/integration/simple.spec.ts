import { resolve } from 'path';

import { JSDOM } from 'jsdom';

import { formatHtml, runPlugin } from '@knodes/typedoc-plugintestbed';

import { checkFile } from '../helpers';

const rootDir = resolve( __dirname, '../mock-fs/simple' );
const docsDir = resolve( rootDir, './docs' );
process.chdir( rootDir );
jest.setTimeout( process.env.CI === 'true' ? 60000 : 30000 );
beforeAll( () => runPlugin( rootDir, resolve( __dirname, '../../src/index' ) ) );
describe( 'Root module', () => {
	it( '`index.html` should be correct', () => checkFile( docsDir, 'index.html', c => {
		const dom = new JSDOM( c );
		const heading = dom.window.document.querySelectorAll( '.tsd-panel h1' );
		expect( heading ).toHaveLength( 1 );
		expect( heading[0] ).toHaveTextContent( 'Root readme' );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
describe( 'packages/a module', () => {
	it( '`modules/_example_package_a.html` should be correct', () => checkFile( docsDir, 'modules/_example_package_a.html', c => {
		const dom = new JSDOM( c );
		const heading = dom.window.document.querySelectorAll( '.tsd-panel h1' );
		expect( heading ).toHaveLength( 1 );
		expect( heading[0] ).toHaveTextContent( 'Readme of A' );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
describe( 'packages/b module', () => {
	it( '`modules/_example_package_b.html` should be correct', () => checkFile( docsDir, 'modules/_example_package_b.html', c => {
		const dom = new JSDOM( c );
		const heading = dom.window.document.querySelectorAll( '.tsd-panel h1' );
		expect( heading ).toHaveLength( 1 );
		expect( heading[0] ).toHaveTextContent( 'Readme of B' );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
