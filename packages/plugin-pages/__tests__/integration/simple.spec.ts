import { readFile } from 'fs/promises';
import { createContext, runInContext } from 'vm';

import { resolve } from '@knodes/typedoc-pluginutils/path';

import { describeDocsFile, formatHtml, getBreadcrumb, runPluginBeforeAll } from '#plugintestbed';

import { name as packageName } from '../../package.json';
import { elementMatcher, menuItemMatcher } from '../helpers';

const rootDir = resolve( __dirname, '../mock-fs/simple' );
process.chdir( rootDir );
runPluginBeforeAll( rootDir, resolve( __dirname, '../../src/index' ) );
describe( 'Pages', () => {
	describe( 'pages/getting-started/index.html', describeDocsFile( rootDir, 'pages/getting-started/index.html', withContent => {
		it( 'should have correct content', withContent( ( _content, dom ) => {
			const content = dom.window.document.querySelectorAll( '.col-content > .tsd-panel' );
			expect( content ).toHaveLength( 1 );
			expect( content[0].innerHTML ).toContain( '<h2>Some foo</h2>' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Getting started', true, 'index.html' ),
				menuItemMatcher( 'Configuration', false, 'configuration.html' ),
				menuItemMatcher( 'Another page', false, 'other.html' ),
				menuItemMatcher( 'Additional resources', false, null ),
				menuItemMatcher( 'Some cool docs', false, '../additional-resources/some-cool-docs.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'Test', attrs: { href: '../../classes/Test.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
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
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Getting started', true, 'index.html' ),
				menuItemMatcher( 'Configuration', true, 'configuration.html' ),
				menuItemMatcher( 'Another page', false, 'other.html' ),
				menuItemMatcher( 'Additional resources', false, null ),
				menuItemMatcher( 'Some cool docs', false, '../additional-resources/some-cool-docs.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'Test', attrs: { href: '../../classes/Test.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
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
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Getting started', false, '../getting-started/index.html' ),
				menuItemMatcher( 'Configuration', false, '../getting-started/configuration.html' ),
				menuItemMatcher( 'Another page', false, '../getting-started/other.html' ),
				menuItemMatcher( 'Additional resources', true, null ),
				menuItemMatcher( 'Some cool docs', true, 'some-cool-docs.html' ),
			] );
		} ) );
		it( 'should have correct secondary navigation', withContent( ( _content, dom ) => {
			const secondaryNavItems = Array.from( dom.window.document.querySelectorAll<HTMLAnchorElement>( '.tsd-navigation.secondary li a' ) );
			expect( secondaryNavItems ).toHaveLength( 1 );
			expect( secondaryNavItems[0] ).toEqual( elementMatcher( { textContent: 'Test', attrs: { href: '../../classes/Test.html' }} ) );
		} ) );
		it( 'should have correct breadcrumb', withContent( ( _content, dom ) => {
			const breadcrumb = getBreadcrumb( dom );
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
			const link = dom.window.document.querySelector( '.tsd-comment a' );
			expect( link ).toBeTruthy();
			expect( link ).toHaveTextContent( /^Configuration$/ );
			expect( link ).toHaveAttribute( 'href', '../pages/getting-started/configuration.html' );
			expect( link?.parentElement ).toHaveTextContent( 'See the Configuration page for infos.' );
		} ) );
		it( 'should have correct primary navigation', withContent( ( _content, dom ) => {
			const primaryNavItems = Array.from( dom.window.document.querySelectorAll( '.tsd-navigation.primary li.pages-entry' ) );
			expect( primaryNavItems ).toEqual( [
				menuItemMatcher( 'Getting started', false, '../pages/getting-started/index.html' ),
				menuItemMatcher( 'Configuration', false, '../pages/getting-started/configuration.html' ),
				menuItemMatcher( 'Another page', false, '../pages/getting-started/other.html' ),
				menuItemMatcher( 'Additional resources', false, null ),
				menuItemMatcher( 'Some cool docs', false, '../pages/additional-resources/some-cool-docs.html' ),
			] );
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
		] );
	} );
} );
