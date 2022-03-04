import { resolve } from 'path';

import { JSDOM } from 'jsdom';

import { formatHtml, runPlugin } from '@knodes/typedoc-plugintestbed';

import { checkFile, menuItemMatcher } from '../helpers';

const rootDir = resolve( __dirname, '../mock-fs/monorepo' );
const docsDir = resolve( rootDir, './docs' );
process.chdir( rootDir );
jest.setTimeout( process.env.CI === 'true' ? 60000 : 30000 );
beforeAll( () => runPlugin( rootDir, resolve( __dirname, '../../src/index' ) ) );
describe( 'Root module', () => {
	it( '`index.html` should be correct', () => checkFile( docsDir, 'index.html', c => {
		const dom = new JSDOM( c );
		const content = dom.window.document.querySelectorAll( '.col-content' );
		expect( content ).toHaveLength( 1 );
		const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
		const menuItems = Array.from( menu.querySelectorAll( 'li.pages-entry' ) );
		expect( menuItems ).toHaveLength( 1 );
		expect( menuItems[0] ).toEqual( menuItemMatcher( 'Root doc', false, 'pages/root-doc.html' ) );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
	it( '`pages/root-doc.html` should be correct', () => checkFile( docsDir, 'pages/root-doc.html', c => {
		const dom = new JSDOM( c );
		const content = dom.window.document.querySelectorAll( '.col-content' );
		expect( content ).toHaveLength( 1 );
		expect( content[0] ).toHaveTextContent( 'Some content for the root' );
		const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
		const menuItems = Array.from( menu.querySelectorAll( 'li.pages-entry' ) );
		expect( menuItems ).toHaveLength( 1 );
		expect( menuItems[0] ).toEqual( menuItemMatcher( 'Root doc', true, 'root-doc.html' ) );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
describe( 'pkg-a', () => {
	it( '`modules/pkg_a.html` should be correct', () => checkFile( docsDir, 'modules/pkg_a.html', c => {
		const dom = new JSDOM( c );
		const content = dom.window.document.querySelectorAll( '.col-content' );
		expect( content ).toHaveLength( 1 );
		// Check if doc content prepended to the module index
		const sep = content[0].querySelectorAll( 'hr' );
		expect( sep ).toHaveLength( 1 );
		expect( sep[0].previousElementSibling ).toHaveTextContent( 'This is appended to the readme of pkg-a' );

		const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
		const menuItems = Array.from( menu.querySelectorAll( 'li.pages-entry' ) );
		expect( menuItems ).toHaveLength( 2 );
		expect( menuItems[0] ).toEqual( menuItemMatcher( 'Root doc', false, '../pages/root-doc.html' ) );
		expect( menuItems[1] ).toEqual( menuItemMatcher( 'Using pkg-a', false, '../pkg_a/pages/using-pkg-a.html' ) );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
	it( '`pkg_a/pages/using-pkg-a.html` should be correct', () => checkFile( docsDir, 'pkg_a/pages/using-pkg-a.html', c => {
		const dom = new JSDOM( c );
		const content = dom.window.document.querySelectorAll( '.col-content' );
		expect( content ).toHaveLength( 1 );
		expect( content[0] ).toHaveTextContent( 'Some content for pkg-a' );

		const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
		const menuItems = Array.from( menu.querySelectorAll( 'li.pages-entry' ) );
		expect( menuItems ).toHaveLength( 2 );
		expect( menuItems[0] ).toEqual( menuItemMatcher( 'Root doc', false, '../../pages/root-doc.html' ) );
		expect( menuItems[1] ).toEqual( menuItemMatcher( 'Using pkg-a', true, 'using-pkg-a.html' ) );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
describe( 'pkg-b', () => {
	it( '`modules/pkg_b.html` should be correct', () => checkFile( docsDir, 'modules/pkg_b.html', c => {
		const dom = new JSDOM( c );
		const content = dom.window.document.querySelectorAll( '.col-content' );
		expect( content ).toHaveLength( 1 );
		// Check if doc content prepended to the module index
		const sep = content[0].querySelectorAll( 'hr' );
		expect( sep ).toHaveLength( 0 );
		expect( content[0] ).not.toHaveTextContent( /This is appended to/ );

		const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
		const menuItems = Array.from( menu.querySelectorAll( 'li.pages-entry' ) );
		expect( menuItems ).toHaveLength( 2 );
		expect( menuItems[0] ).toEqual( menuItemMatcher( 'Root doc', false, '../pages/root-doc.html' ) );
		expect( menuItems[1] ).toEqual( menuItemMatcher( 'Using pkg-b', false, '../pkg_b/pages/using-pkg-b.html' ) );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
	it( '`pkg_b/pages/using-pkg-b.html` should be correct', () => checkFile( docsDir, 'pkg_b/pages/using-pkg-b.html', c => {
		const dom = new JSDOM( c );
		const content = dom.window.document.querySelectorAll( '.col-content' );
		expect( content ).toHaveLength( 1 );
		expect( content[0] ).toHaveTextContent( 'Some content for pkg-b' );

		const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
		const menuItems = Array.from( menu.querySelectorAll( 'li.pages-entry' ) );
		expect( menuItems ).toHaveLength( 2 );
		expect( menuItems[0] ).toEqual( menuItemMatcher( 'Root doc', false, '../../pages/root-doc.html' ) );
		expect( menuItems[1] ).toEqual( menuItemMatcher( 'Using pkg-b', true, 'using-pkg-b.html' ) );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
