import { describeDocsFile, formatHtml, getBreadcrumb, runPluginBeforeAll } from '#plugintestbed';

import { elementMatcher, menuItemMatcher, mockFs, pluginPath } from '../helpers';
import { name as packageName } from '../mock-fs/monorepo/package.json';

const rootDir = mockFs( 'monorepo' );
process.chdir( rootDir );
runPluginBeforeAll( rootDir, pluginPath );
describe( 'Root module', () => {
	describe( 'index.html', describeDocsFile( rootDir, 'index.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 2 );

			expect( content[0] ).toHaveTextContent( 'This is appended to the root module See stubA, stubA, stubB or stubB' );
			const links = content[0].querySelectorAll( 'a' );
			expect( links ).toHaveLength( 2 );
			expect( links[0] ).not.toHaveAttribute( 'href', links[1].href );

			expect( content[1] ).toHaveTextContent( 'Test root readme. stubA stubB' );
			expect( content[1].querySelectorAll( 'a' ) ).toHaveLength( 2 );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, 'pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, 'pages/root-doc/root-doc-child.html' ),
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
	describe( 'pages/root-doc/index.html', describeDocsFile( rootDir, 'pages/root-doc/index.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Some content for the root' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', true, 'index.html' ),
				menuItemMatcher( 'Root doc child', false, 'root-doc-child.html' ),
			] );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 2 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../modules.html', text: packageName },
				{ href: 'index.html', text: 'Root doc' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
	describe( 'pages/root-doc/root-doc-child.html', describeDocsFile( rootDir, 'pages/root-doc/root-doc-child.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Some content for the root child with a link to Using pkg-a' );

			const links = content[0].querySelectorAll( 'a' );
			expect( links ).toHaveLength( 1 );
			expect( links[0] ).toHaveTextContent( 'Using pkg-a' );
			expect( links[0] ).toHaveAttribute( 'href', '../pkg_a/using-pkg-a.html' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', true, 'index.html' ),
				menuItemMatcher( 'Root doc child', true, 'root-doc-child.html' ),
			] );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 3 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../modules.html', text: packageName },
				{ href: 'index.html', text: 'Root doc' },
				{ href: 'root-doc-child.html', text: 'Root doc child' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
} );
describe( 'pkg-a', () => {
	describe( 'modules/pkg_a.html', describeDocsFile( rootDir, 'modules/pkg_a.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content' );
			expect( content ).toHaveLength( 1 );
			// Check if doc content prepended to the module index
			const sep = content[0].querySelectorAll( 'hr' );
			expect( sep ).toHaveLength( 1 );
			expect( sep[0].previousElementSibling ).toHaveTextContent( 'README for A See stubA, stubA, stubB or stubB' );
			const links = sep[0].previousElementSibling!.querySelector( ':scope > p' )!.querySelectorAll( 'a' );
			expect( links ).toHaveLength( 3 );
			expect( links[0] ).toHaveAttribute( 'href', links[1].href );
			expect( links[1] ).not.toHaveAttribute( 'href', links[2].href );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../pages/root-doc/root-doc-child.html' ),
				menuItemMatcher( 'Using pkg-a', false, '../pages/pkg_a/using-pkg-a.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubA', attrs: { href: '../variables/pkg_a.stubA.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 2 );
			expect( breadcrumb ).toEqual( [
				{ href: '../modules.html', text: packageName },
				{ href: 'pkg_a.html', text: 'pkg-a' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
	describe( 'pages/pkg_a/using-pkg-a.html', describeDocsFile( rootDir, 'pages/pkg_a/using-pkg-a.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Some content for pkg-a' );
			const link = content[0].querySelector( 'p > a' );
			expect( link ).toHaveAttribute( 'href', '../pkg_b/using-pkg-b/index.html' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../root-doc/root-doc-child.html' ),
				menuItemMatcher( 'Using pkg-a', true, 'using-pkg-a.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubA', attrs: { href: '../../variables/pkg_a.stubA.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 3 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../modules.html', text: packageName },
				{ href: '../../modules/pkg_a.html', text: 'pkg-a' },
				{ href: 'using-pkg-a.html', text: 'Using pkg-a' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
	describe( 'variables/pkg_a.stubA.html', describeDocsFile( rootDir, 'variables/pkg_a.stubA.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const comment = dom.window.document.querySelector( '.tsd-comment' );
			expect( comment ).toHaveTextContent( 'See also the root doc page. This should point to the README stubB' );
			const links = comment!.querySelectorAll( 'a' );
			expect( links ).toHaveLength( 3 );
			expect( links[0] ).toHaveTextContent( /^the root doc page$/ );
			expect( links[0] ).toHaveAttribute( 'href', '../pages/root-doc/index.html' );
			expect( links[1] ).toHaveTextContent( /^the README$/ );
			expect( links[1] ).toHaveAttribute( 'href', '../modules/pkg_a.html' );
			expect( links[2] ).toHaveTextContent( /^stubB$/ );
			expect( links[2] ).toHaveAttribute( 'href', 'pkg_b.stubB.html' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../pages/root-doc/root-doc-child.html' ),
				menuItemMatcher( 'Using pkg-a', false, '../pages/pkg_a/using-pkg-a.html' ),
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
} );
describe( 'pkg-b', () => {
	describe( 'modules/pkg_b.html', describeDocsFile( rootDir, 'modules/pkg_b.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content' );
			expect( content ).toHaveLength( 1 );
			// Check if doc content prepended to the module index
			const sep = content[0].querySelectorAll( 'hr' );
			expect( sep ).toHaveLength( 1 );
			expect( sep[0].previousElementSibling ).toHaveTextContent( 'README for B See stubA, stubA, stubB or stubB' );
			const links = sep[0].previousElementSibling!.querySelector( ':scope > p' )!.querySelectorAll( 'a' );
			expect( links ).toHaveLength( 3 );
			expect( links[0] ).not.toHaveAttribute( 'href', links[1].href );
			expect( links[1] ).toHaveAttribute( 'href', links[2].href );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 4 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../pages/root-doc/root-doc-child.html' ),
				menuItemMatcher( 'Using pkg-b', false, '../pages/pkg_b/using-pkg-b/index.html' ),
				menuItemMatcher( 'pkg-b details', false, '../pages/pkg_b/using-pkg-b/pkg-b-details.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubB', attrs: { href: '../variables/pkg_b.stubB.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 2 );
			expect( breadcrumb ).toEqual( [
				{ href: '../modules.html', text: packageName },
				{ href: 'pkg_b.html', text: 'pkg-b' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );

	describe( 'pages/pkg_b/using-pkg-b/index.html', describeDocsFile( rootDir, 'pages/pkg_b/using-pkg-b/index.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Some content for pkg-b See stubA, stubA, stubB or stubB' );
			const links = content[0].querySelector( ':scope > p' )!.querySelectorAll( 'a' );
			expect( links ).toHaveLength( 3 );
			expect( links[0] ).not.toHaveAttribute( 'href', links[1].href );
			expect( links[1] ).toHaveAttribute( 'href', links[2].href );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 4 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../../root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../../root-doc/root-doc-child.html' ),
				menuItemMatcher( 'Using pkg-b', true, 'index.html' ),
				menuItemMatcher( 'pkg-b details', false, 'pkg-b-details.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubB', attrs: { href: '../../../variables/pkg_b.stubB.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 3 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../../modules.html', text: packageName },
				{ href: '../../../modules/pkg_b.html', text: 'pkg-b' },
				{ href: 'index.html', text: 'Using pkg-b' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );

	describe( 'pages/pkg_b/using-pkg-b/pkg-b-details.html', describeDocsFile( rootDir, 'pages/pkg_b/using-pkg-b/pkg-b-details.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Test' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 4 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../../root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../../root-doc/root-doc-child.html' ),
				menuItemMatcher( 'Using pkg-b', true, 'index.html' ),
				menuItemMatcher( 'pkg-b details', true, 'pkg-b-details.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubB', attrs: { href: '../../../variables/pkg_b.stubB.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 4 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../../modules.html', text: packageName },
				{ href: '../../../modules/pkg_b.html', text: 'pkg-b' },
				{ href: 'index.html', text: 'Using pkg-b' },
				{ href: 'pkg-b-details.html', text: 'pkg-b details' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );

	describe( 'variables/pkg_b.stubB.html', describeDocsFile( rootDir, 'variables/pkg_b.stubB.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const link = dom.window.document.querySelector( '.tsd-comment a' );
			expect( link ).toBeTruthy();
			expect( link ).toHaveTextContent( /^another link$/ );
			expect( link ).toHaveAttribute( 'href', '../pages/pkg_a/using-pkg-a.html' );
			expect( link!.parentElement ).toHaveTextContent( 'See also another link.' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toHaveLength( 4 );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../pages/root-doc/root-doc-child.html' ),
				menuItemMatcher( 'Using pkg-b', false, '../pages/pkg_b/using-pkg-b/index.html' ),
				menuItemMatcher( 'pkg-b details', false, '../pages/pkg_b/using-pkg-b/pkg-b-details.html' ),
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
} );
describe( 'pkg-c', () => {
	describe( 'modules/pkg_c.html', describeDocsFile( rootDir, 'modules/pkg_c.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content' );
			expect( content ).toHaveLength( 1 );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../pages/root-doc/root-doc-child.html' ),
				menuItemMatcher( 'This is a sample page', false, '../pages/pkg_c/this-is-a-sample-page.html' ),
				menuItemMatcher( 'Package C child 1', false, '../pages/pkg_c/package-c-child-1/index.html' ),
				menuItemMatcher( 'Package C child 1 sub', false, '../pages/pkg_c/package-c-child-1/package-c-child-1-sub.html' ),
				menuItemMatcher( 'Package C child 2', false, '../pages/pkg_c/package-c-child-2.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubC', attrs: { href: '../variables/pkg_c.stubC.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 2 );
			expect( breadcrumb ).toEqual( [
				{ href: '../modules.html', text: packageName },
				{ href: 'pkg_c.html', text: 'pkg-c' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );

	describe( 'pages/pkg_c/this-is-a-sample-page.html', describeDocsFile( rootDir, 'pages/pkg_c/this-is-a-sample-page.html', withContent => {
		it( 'should have correct content', withContent( ( _content, _dom, doc ) => {
			expect( doc.querySelector( '.tsd-page-title > h1' ) ).toHaveTextContent( 'This is a sample page' );
			const content = doc.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Here, I can write pretty much anything' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../root-doc/root-doc-child.html' ),
				menuItemMatcher( 'This is a sample page', true, 'this-is-a-sample-page.html' ),
				menuItemMatcher( 'Package C child 1', false, 'package-c-child-1/index.html' ),
				menuItemMatcher( 'Package C child 1 sub', false, 'package-c-child-1/package-c-child-1-sub.html' ),
				menuItemMatcher( 'Package C child 2', false, 'package-c-child-2.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubC', attrs: { href: '../../variables/pkg_c.stubC.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 3 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../modules.html', text: packageName },
				{ href: '../../modules/pkg_c.html', text: 'pkg-c' },
				{ href: 'this-is-a-sample-page.html', text: 'This is a sample page' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );

	describe( 'pages/pkg_c/package-c-child-1/index.html', describeDocsFile( rootDir, 'pages/pkg_c/package-c-child-1/index.html', withContent => {
		it( 'should have correct content', withContent( ( _content, _dom, doc ) => {
			expect( doc.querySelector( '.tsd-page-title > h1' ) ).toHaveTextContent( 'Package C child 1' );
			const content = doc.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Package C child 1 content' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../../root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../../root-doc/root-doc-child.html' ),
				menuItemMatcher( 'This is a sample page', false, '../this-is-a-sample-page.html' ),
				menuItemMatcher( 'Package C child 1', true, 'index.html' ),
				menuItemMatcher( 'Package C child 1 sub', false, 'package-c-child-1-sub.html' ),
				menuItemMatcher( 'Package C child 2', false, '../package-c-child-2.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubC', attrs: { href: '../../../variables/pkg_c.stubC.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 3 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../../modules.html', text: packageName },
				{ href: '../../../modules/pkg_c.html', text: 'pkg-c' },
				{ href: 'index.html', text: 'Package C child 1' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );

	describe( 'pages/pkg_c/package-c-child-1/package-c-child-1-sub.html', describeDocsFile( rootDir, 'pages/pkg_c/package-c-child-1/package-c-child-1-sub.html', withContent => {
		it( 'should have correct content', withContent( ( _content, _dom, doc ) => {
			expect( doc.querySelector( '.tsd-page-title > h1' ) ).toHaveTextContent( 'Package C child 1 sub' );
			const content = doc.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Package C child 1 sub content' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../../root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../../root-doc/root-doc-child.html' ),
				menuItemMatcher( 'This is a sample page', false, '../this-is-a-sample-page.html' ),
				menuItemMatcher( 'Package C child 1', true, 'index.html' ),
				menuItemMatcher( 'Package C child 1 sub', true, 'package-c-child-1-sub.html' ),
				menuItemMatcher( 'Package C child 2', false, '../package-c-child-2.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubC', attrs: { href: '../../../variables/pkg_c.stubC.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 4 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../../modules.html', text: packageName },
				{ href: '../../../modules/pkg_c.html', text: 'pkg-c' },
				{ href: 'index.html', text: 'Package C child 1' },
				{ href: 'package-c-child-1-sub.html', text: 'Package C child 1 sub' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );

	describe( 'pages/pkg_c/package-c-child-2.html', describeDocsFile( rootDir, 'pages/pkg_c/package-c-child-2.html', withContent => {
		it( 'should have correct content', withContent( ( _content, _dom, doc ) => {
			expect( doc.querySelector( '.tsd-page-title > h1' ) ).toHaveTextContent( 'Package C child 2' );
			const content = doc.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0] ).toHaveTextContent( 'Package C child 2 content' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../root-doc/root-doc-child.html' ),
				menuItemMatcher( 'This is a sample page', false, 'this-is-a-sample-page.html' ),
				menuItemMatcher( 'Package C child 1', false, 'package-c-child-1/index.html' ),
				menuItemMatcher( 'Package C child 1 sub', false, 'package-c-child-1/package-c-child-1-sub.html' ),
				menuItemMatcher( 'Package C child 2', true, 'package-c-child-2.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'stubC', attrs: { href: '../../variables/pkg_c.stubC.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 3 );
			expect( breadcrumb ).toEqual( [
				{ href: '../../modules.html', text: packageName },
				{ href: '../../modules/pkg_c.html', text: 'pkg-c' },
				{ href: 'package-c-child-2.html', text: 'Package C child 2' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );

	describe( 'variables/pkg_c.stubC.html', describeDocsFile( rootDir, 'variables/pkg_c.stubC.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const link = dom.window.document.querySelector( '.tsd-comment a' );
			expect( link ).toBeTruthy();
			expect( link ).toHaveTextContent( /^another link$/ );
			expect( link ).toHaveAttribute( 'href', '../pages/pkg_c/package-c-child-1/index.html' );
			expect( link!.parentElement ).toHaveTextContent( 'See also another link.' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Root doc', false, '../pages/root-doc/index.html' ),
				menuItemMatcher( 'Root doc child', false, '../pages/root-doc/root-doc-child.html' ),
				menuItemMatcher( 'This is a sample page', false, '../pages/pkg_c/this-is-a-sample-page.html' ),
				menuItemMatcher( 'Package C child 1', false, '../pages/pkg_c/package-c-child-1/index.html' ),
				menuItemMatcher( 'Package C child 1 sub', false, '../pages/pkg_c/package-c-child-1/package-c-child-1-sub.html' ),
				menuItemMatcher( 'Package C child 2', false, '../pages/pkg_c/package-c-child-2.html' ),
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
} );
