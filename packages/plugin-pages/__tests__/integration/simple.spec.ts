import { resolve } from 'path';

import { JSDOM } from 'jsdom';

import { formatHtml, runPlugin } from '@knodes/typedoc-plugintestbed';

import { checkFile, menuItemMatcher } from '../helpers';

const rootDir = resolve( __dirname, '../mock-fs/simple' );
const docsDir = resolve( rootDir, './docs' );
process.chdir( rootDir );
jest.setTimeout( process.env.CI === 'true' ? 60000 : 30000 );
beforeAll( () => runPlugin( rootDir, resolve( __dirname, '../../src/index' ) ) );
describe( 'Pages', () => {
	it( '`pages/getting-started/index.html` should be correct', () => checkFile( docsDir, 'pages/getting-started/index.html', c => {
		expect( c ).toContain( '<h2>Some foo</h2>' );
		const dom = new JSDOM( c );
		const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
		const items = Array.from( menu.querySelectorAll( 'li' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Getting started', true, 'index.html' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Configuration', false, 'configuration.html' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Additional resources', false, null ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Some cool docs', false, '../additional-resources/some-cool-docs.html' ) );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
	it( '`pages/getting-started/configuration.html` should be correct', () => checkFile( docsDir, 'pages/getting-started/configuration.html', c => {
		expect( c ).toContain( '<h2>Some bar</h2>' );
		const dom = new JSDOM( c );
		const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
		const items = Array.from( menu.querySelectorAll( 'li' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Getting started', true, 'index.html' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Configuration', true, 'configuration.html' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Additional resources', false, null ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Some cool docs', false, '../additional-resources/some-cool-docs.html' ) );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
	it( '`pages/additional-resources/some-cool-docs.html` should be correct', () => checkFile( docsDir, 'pages/additional-resources/some-cool-docs.html', c => {
		expect( c ).toContain( '<h2>Some baaz</h2>' );
		const dom = new JSDOM( c );
		const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
		const items = Array.from( menu.querySelectorAll( 'li' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Getting started', false, '../getting-started/index.html' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Configuration', false, '../getting-started/configuration.html' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Additional resources', true, null ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Some cool docs', true, 'some-cool-docs.html' ) );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
describe( 'Documentation', () => {
	it( '`classes/Test.html` should be correct', () => checkFile( docsDir, 'classes/Test.html', c => {
		const dom = new JSDOM( c );
		const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
		const items = Array.from( menu.querySelectorAll( 'li' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Getting started', false, '../pages/getting-started/index.html' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Configuration', false, '../pages/getting-started/configuration.html' ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Additional resources', false, null ) );
		expect( items ).toContainEqual( menuItemMatcher( 'Some cool docs', false, '../pages/additional-resources/some-cool-docs.html' ) );
		const link = dom.window.document.querySelector( '.tsd-comment a' );
		expect( link ).toBeTruthy();
		expect( link ).toHaveTextContent( /^Configuration$/ );
		expect( link ).toHaveAttribute( 'href', '../pages/getting-started/configuration.html' );
		expect( formatHtml( c ) ).toMatchSnapshot();
	} ) );
} );
