import { resolve } from 'path';

import { describeDocsFile, formatHtml, getBreadcrumb, runPluginBeforeAll } from '#plugintestbed';

import { elementMatcher, menuItemMatcher } from '../helpers';
import { name as packageName } from '../mock-fs/monorepo/package.json';

const rootDir = resolve( __dirname, '../mock-fs/monorepo' );
process.chdir( rootDir );
runPluginBeforeAll( rootDir, resolve( __dirname, '../../src/index' ) );
describe( 'Root module', () => {
	describe( '`index.html`', describeDocsFile( rootDir, 'index.html', it => {
		it( 'should have correct content', ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 2 );

			expect( content[0] ).toHaveTextContent( 'This is appended to the root module See stubA, stubA, stubB or stubB' );
			const links = content[0].querySelectorAll( 'a' );
			expect( links ).toHaveLength( 2 );
			expect( links[0] ).not.toHaveAttribute( 'href', links[1].href );

			expect( content[1] ).toHaveTextContent( 'Test root readme. stubA stubB' );
			expect( content[1].querySelectorAll( 'a' ) ).toHaveLength( 2 );
		} );
		it( 'should have correct primary navigation', ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, 'pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, 'pages/root-doc/child.html' ),
			] );
		} );
		it( 'should have constant content', ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
	describe( '`pages/root-doc/index.html`', describeDocsFile( rootDir, 'pages/root-doc/index.html', it => {
		it( 'should have correct content', ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Some content for the root' );
		} );
		it( 'should have correct primary navigation', ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 2 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', true, 'index.html' ),
				menuItemMatcher( 'Root doc child', false, 'child.html' ),
			] );
		} );
		it( 'should have correct breadcrumb', ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 2 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../modules.html', text: packageName },
				{ href: 'index.html', text: 'Root doc' },
			] );
		} );
		it( 'should have constant content', ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
	describe( '`pages/root-doc/child.html`', describeDocsFile( rootDir, 'pages/root-doc/child.html', it => {
		it( 'should have correct content', ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Some content for the root child with a link to Using pkg-a' );

			const links = content[0].querySelectorAll( 'a' );
			expect( links ).toHaveLength( 1 );
			expect( links[0] ).toHaveTextContent( 'Using pkg-a' );
			expect( links[0] ).toHaveAttribute( 'href', '../../pkg_a/pages/using-pkg-a.html' );
		} );
		it( 'should have correct primary navigation', ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 2 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', true, 'index.html' ),
				menuItemMatcher( 'Root doc child', true, 'child.html' ),
			] );
		} );
		it( 'should have correct breadcrumb', ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 3 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../modules.html', text: packageName },
				{ href: 'index.html', text: 'Root doc' },
				{ href: 'child.html', text: 'Root doc child' },
			] );
		} );
		it( 'should have constant content', ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
} );
describe( 'pkg-a', () => {
	describe( '`modules/pkg_a.html`', describeDocsFile( rootDir, 'modules/pkg_a.html', it => {
		it( 'should have correct content', ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content' );
			expect( content ).toHaveLength( 1 );
			// Check if doc content prepended to the module index
			const sep = content[0].querySelectorAll( 'hr' );
			expect( sep ).toHaveLength( 1 );
			expect( sep[0].previousElementSibling ).toHaveTextContent( 'This is appended to the readme of pkg-a See stubA, stubA, stubB or stubB' );
			const links = sep[0].previousElementSibling!.querySelector( ':scope > p' )!.querySelectorAll( 'a' );
			expect( links ).toHaveLength( 3 );
			expect( links[0] ).toHaveAttribute( 'href', links[1].href );
			expect( links[1] ).not.toHaveAttribute( 'href', links[2].href );
		} );
		it( 'should have correct primary navigation', ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 3 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../pages/root-doc/child.html' ),
				menuItemMatcher( 'Using pkg-a', false, '../pkg_a/pages/using-pkg-a.html' ),
			] );
		} );
		it( 'should have correct secondary navigation', ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubA', attrs: { href: '../variables/pkg_a.stubA.html' }} ) );
		} );
		it( 'should have correct breadcrumb', ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 2 );
			expect( breadcrumb ).toEqual( [
				{ href: '../modules.html', text: packageName },
				{ href: 'pkg_a.html', text: 'pkg-a' },
			] );
		} );
		it( 'should have constant content', ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
	describe( '`pkg_a/pages/using-pkg-a.html`', describeDocsFile( rootDir, 'pkg_a/pages/using-pkg-a.html', it => {
		it( 'should have correct content', ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Some content for pkg-a' );
		} );
		it( 'should have correct primary navigation', ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 3 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../../pages/root-doc/child.html' ),
				menuItemMatcher( 'Using pkg-a', true, 'using-pkg-a.html' ),
			] );
		} );
		it( 'should have correct secondary navigation', ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubA', attrs: { href: '../../variables/pkg_a.stubA.html' }} ) );
		} );
		it( 'should have correct breadcrumb', ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 3 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../modules.html', text: packageName },
				{ href: '../../modules/pkg_a.html', text: 'pkg-a' },
				{ href: 'using-pkg-a.html', text: 'Using pkg-a' },
			] );
		} );
		it( 'should have constant content', ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
	describe( '`variables/pkg_a.stubA.html`', describeDocsFile( rootDir, 'variables/pkg_a.stubA.html', it => {
		it( 'should have correct content', ( _content, dom ) => {
			const link = dom.window.document.querySelector( '.tsd-comment a' );
			expect( link ).toBeTruthy();
			expect( link ).toHaveTextContent( /^the root doc page$/ );
			expect( link ).toHaveAttribute( 'href', '../pages/root-doc/index.html' );
			expect( link!.closest( '.tsd-comment' ) ).toHaveTextContent( 'See also the root doc page. stubB' );
		} );
		it( 'should have correct primary navigation', ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 3 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../pages/root-doc/child.html' ),
				menuItemMatcher( 'Using pkg-a', false, '../pkg_a/pages/using-pkg-a.html' ),
			] );
		} );
		it( 'should have constant content', ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
} );
describe( 'pkg-b', () => {
	describe( '`modules/pkg_b.html`', describeDocsFile( rootDir, 'modules/pkg_b.html', it => {
		it( 'should have correct content', ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content' );
			expect( content ).toHaveLength( 1 );
			// Check if doc content prepended to the module index
			const sep = content[0].querySelectorAll( 'hr' );
			expect( sep ).toHaveLength( 0 );
			expect( content[0] ).not.toHaveTextContent( /This is appended to/ );
		} );
		it( 'should have correct primary navigation', ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 4 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../pages/root-doc/child.html' ),
				menuItemMatcher( 'Using pkg-b', false, '../pkg_b/pages/using-pkg-b/index.html' ),
				menuItemMatcher( 'pkg-b details', false, '../pkg_b/pages/using-pkg-b/details.html' ),
			] );
		} );
		it( 'should have correct secondary navigation', ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubB', attrs: { href: '../variables/pkg_b.stubB.html' }} ) );
		} );
		it( 'should have correct breadcrumb', ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 2 );
			expect( breadcrumb ).toEqual( [
				{ href: '../modules.html', text: packageName },
				{ href: 'pkg_b.html', text: 'pkg-b' },
			] );
		} );
		it( 'should have constant content', ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );

	describe( '`pkg_b/pages/using-pkg-b/index.html`', describeDocsFile( rootDir, 'pkg_b/pages/using-pkg-b/index.html', it => {
		it( 'should have correct content', ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Some content for pkg-b See stubA, stubA, stubB or stubB' );
			const links = content[0].querySelector( ':scope > p' )!.querySelectorAll( 'a' );
			expect( links ).toHaveLength( 3 );
			expect( links[0] ).not.toHaveAttribute( 'href', links[1].href );
			expect( links[1] ).toHaveAttribute( 'href', links[2].href );
		} );
		it( 'should have correct primary navigation', ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 4 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../../../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../../../pages/root-doc/child.html' ),
				menuItemMatcher( 'Using pkg-b', true, 'index.html' ),
				menuItemMatcher( 'pkg-b details', false, 'details.html' ),
			] );
		} );
		it( 'should have correct secondary navigation', ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubB', attrs: { href: '../../../variables/pkg_b.stubB.html' }} ) );
		} );
		it( 'should have correct breadcrumb', ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 3 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../../modules.html', text: packageName },
				{ href: '../../../modules/pkg_b.html', text: 'pkg-b' },
				{ href: 'index.html', text: 'Using pkg-b' },
			] );
		} );
		it( 'should have constant content', ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );

	describe( '`pkg_b/pages/using-pkg-b/details.html`', describeDocsFile( rootDir, 'pkg_b/pages/using-pkg-b/details.html', it => {
		it( 'should have correct content', ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Test' );
		} );
		it( 'should have correct primary navigation', ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 4 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../../../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../../../pages/root-doc/child.html' ),
				menuItemMatcher( 'Using pkg-b', true, 'index.html' ),
				menuItemMatcher( 'pkg-b details', true, 'details.html' ),
			] );
		} );
		it( 'should have correct secondary navigation', ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubB', attrs: { href: '../../../variables/pkg_b.stubB.html' }} ) );
		} );
		it( 'should have correct breadcrumb', ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 4 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../../modules.html', text: packageName },
				{ href: '../../../modules/pkg_b.html', text: 'pkg-b' },
				{ href: 'index.html', text: 'Using pkg-b' },
				{ href: 'details.html', text: 'pkg-b details' },
			] );
		} );
		it( 'should have constant content', ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );

	describe( '`variables/pkg_b.stubB.html`', describeDocsFile( rootDir, 'variables/pkg_b.stubB.html', it => {
		it( 'should have correct content', ( _content, dom ) => {
			const link = dom.window.document.querySelector( '.tsd-comment a' );
			expect( link ).toBeTruthy();
			expect( link ).toHaveTextContent( /^another link$/ );
			expect( link ).toHaveAttribute( 'href', '../pkg_a/pages/using-pkg-a.html' );
			expect( link!.parentElement ).toHaveTextContent( 'See also another link.' );
		} );
		it( 'should have correct primary navigation', ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 4 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../pages/root-doc/child.html' ),
				menuItemMatcher( 'Using pkg-b', false, '../pkg_b/pages/using-pkg-b/index.html' ),
				menuItemMatcher( 'pkg-b details', false, '../pkg_b/pages/using-pkg-b/details.html' ),
			] );
		} );
		it( 'should have constant content', ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} );
	} ) );
} );
