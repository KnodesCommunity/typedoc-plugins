import { readFile } from 'fs/promises';
import { createContext, runInContext } from 'vm';

import { resolve } from '@knodes/typedoc-pluginutils/path';

import { describeDocsFile, formatHtml, getBreadcrumb, runPluginBeforeAll } from '#plugintestbed';

import { name as packageName } from '../../package.json';
import { elementMatcher, menuItemMatcher, mockFs, pluginPath } from '../helpers';

const rootDir = mockFs( 'simple' );
process.chdir( rootDir );
runPluginBeforeAll( rootDir, pluginPath );
describe( 'Pages', () => {
	describe( 'pages/getting-started/index.html', describeDocsFile( rootDir, 'pages/getting-started/index.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0].innerHTML ).toContain( '<h2>Some foo</h2>' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Getting started', true, 'index.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Configuration', false, 'configuration.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Additional resources', false, null ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Some cool docs', false, '../additional-resources/some-cool-docs.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Test page front matter', false, '../test-page-front-matter.html' ) );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'Test', attrs: { href: '../../classes/Test.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 2 );
			expect( breadcrumb ).toIncludeSameMembers( [
				{ href: '../../modules.html', text: packageName },
				{ href: 'index.html', text: 'Getting started' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
	describe( 'pages/getting-started/configuration.html', describeDocsFile( rootDir, 'pages/getting-started/configuration.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0].innerHTML ).toContain( '<h2>Some bar</h2>' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Getting started', true, 'index.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Configuration', true, 'configuration.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Additional resources', false, null ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Some cool docs', false, '../additional-resources/some-cool-docs.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Test page front matter', false, '../test-page-front-matter.html' ) );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'Test', attrs: { href: '../../classes/Test.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 3 );
			expect( breadcrumb ).toIncludeSameMembers( [
				{ href: '../../modules.html', text: packageName },
				{ href: 'index.html', text: 'Getting started' },
				{ href: 'configuration.html', text: 'Configuration' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
	describe( 'pages/additional-resources/some-cool-docs.html', describeDocsFile( rootDir, 'pages/additional-resources/some-cool-docs.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0].innerHTML ).toContain( '<h2>Some baaz</h2>' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Getting started', false, '../getting-started/index.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Configuration', false, '../getting-started/configuration.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Additional resources', true, null ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Some cool docs', true, 'some-cool-docs.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Test page front matter', false, '../test-page-front-matter.html' ) );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'Test', attrs: { href: '../../classes/Test.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
			expect( breadcrumb ).toHaveLength( 3 );
			expect( breadcrumb ).toIncludeSameMembers( [
				{ href: '../../modules.html', text: packageName },
				{ href: null, text: 'Additional resources' },
				{ href: 'some-cool-docs.html', text: 'Some cool docs' },
			] );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
} );
describe( 'Documentation', () => {
	describe( 'classes/Test.html', describeDocsFile( rootDir, 'classes/Test.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const links = dom.window.document.querySelectorAll( '.tsd-comment a' );
			expect( links ).toHaveLength( 2 );
			expect( links[0] ).toHaveTextContent( /^Configuration$/ );
			expect( links[0] ).toHaveAttribute( 'href', '../pages/getting-started/configuration.html' );
			expect( links[0]?.parentElement ).toHaveTextContent( 'See the Configuration page for infos.' );
			expect( links[1] ).toHaveTextContent( /^Test page front matter$/ );
			expect( links[1] ).toHaveAttribute( 'href', '../pages/test-page-front-matter.html' );
			expect( links[1]?.parentElement ).toHaveTextContent( 'Checkout also the Test page front matter page.' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Getting started', false, '../pages/getting-started/index.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Configuration', false, '../pages/getting-started/configuration.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Additional resources', false, null ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Some cool docs', false, '../pages/additional-resources/some-cool-docs.html' ) );
			expect( primaryNavItems ).toContainEqual( menuItemMatcher( 'Test page front matter', false, '../pages/test-page-front-matter.html' ) );
		} ) );
		it( 'should have constant content', withContent( ( content, _dom ) => {
			expect( formatHtml( content ) ).toMatchSnapshot();
		} ) );
	} ) );
} );
describe( 'Search index', () => {
	let searchData: any;
	beforeAll( async () => {
		const searchDataAsset = resolve( rootDir, 'docs/assets/search.js' );
		const ctx = { window: {} as any };
		createContext( ctx );
		const code = await readFile( searchDataAsset, 'utf-8' );
		runInContext( code, ctx );
		searchData = ctx.window.searchData;
	} );
	it( 'should have pages in search index', () => {
		expect( searchData.rows ).toIncludeAllPartialMembers( [
			{ name: 'Getting started' },
			{ name: 'Getting started > Configuration' },
			{ name: 'Additional resources > Some cool docs' },
			{ name: 'Test page front matter' },
		] );
	} );
} );
