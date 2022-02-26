import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { JSDOM } from 'jsdom';
import { escapeRegExp } from 'lodash';
import { Application, ArgumentsReader, TSConfigReader, TypeDocOptions, TypeDocReader } from 'typedoc';

const rootDir = resolve( __dirname, '../mock-fs/simple' );
jest.setTimeout( 30000 );
beforeEach( () => {
	process.chdir( rootDir );
} );
const checkFile = async ( ...args: [...paths: string[], withContent: ( text: string ) => Promise<void> | void] ) => {
	const fullPath = resolve( ...args.slice( 0, -1 ) as string[] );
	const content = await readFile( fullPath, 'utf-8' );
	const cb = args[args.length - 1] as ( text: string ) => Promise<void> | void;
	await cb( content );
};
const setName = ( fn: any, name: string ) => {
	Object.defineProperty( fn, 'toString', { value: () => name, writable: true } );
	return fn;
};
const passes = <T extends unknown[]>( assert: ( ...args: T ) => void ) => setName( ( ...args: T ) => {
	try{
		assert( ...args );
		return true;
	} catch( _e ){
		return false;
	}
}, `passes(${assert.toString()})` );
const menuItemMatcher = ( text: string, current: boolean, link: string | null ) => {
	const reg = new RegExp( `^(\\s|<wbr\\s*\\/>|⇒)*${escapeRegExp( text )}$` );
	return expect.toSatisfy( setName(
		passes( ( x: HTMLLIElement ) => {
			expect( x ).toHaveTextContent( reg, { normalizeWhitespace: true } );
			if( current ){
				expect( x ).toHaveClass( 'current' );
			} else {
				expect( x ).not.toHaveClass( 'current' );
			}
			const a = x.querySelector( 'a' );
			expect( a ).toBeTruthy();
			if( link === null ){
				expect( a ).not.toHaveAttribute( 'href' );
			} else {
				expect( a ).toHaveAttribute( 'href', link );
			}
		} ),
		`menuItemMatcher(text: ${JSON.stringify( text )}, current: ${JSON.stringify( current )}, link: ${JSON.stringify( link )})` ) );
};
describe( 'Real behavior', () => {
	it( 'should render correctly', async () => {
		const app = new Application();
		app.options.addReader( new ArgumentsReader( 0, [] ) );
		app.options.addReader( new TypeDocReader() );
		app.options.addReader( new TSConfigReader() );
		const baseOptions: Partial<TypeDocOptions> = {
			entryPoints: [ resolve( rootDir, './src/test.ts' ) ],
			tsconfig: resolve( rootDir, './tsconfig.json' ),
			treatWarningsAsErrors: true,
			plugin: [ resolve( __dirname, '../../src/index' ) ],
		};
		app.bootstrap( { ...baseOptions } as any );
		const project = app.convert()!;
		app.validate( project );
		const docsDir = resolve( rootDir, './docs' );
		await app.generateDocs( project, docsDir );
		await checkFile( docsDir, 'pages/foo/index.html', c => {
			expect( c ).toContain( '<h2>Some foo</h2>' );
			const dom = new JSDOM( c );
			const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
			const items = Array.from( menu.querySelectorAll( 'li' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Foo', true, 'index.html' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Bar', false, 'bar.html' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Qux', false, null ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Baaz', false, '../qux/baaz.html' ) );
		} );
		await checkFile( docsDir, 'pages/foo/bar.html', c => {
			expect( c ).toContain( '<h2>Some bar</h2>' );
			const dom = new JSDOM( c );
			const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
			const items = Array.from( menu.querySelectorAll( 'li' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Foo', true, 'index.html' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Bar', true, 'bar.html' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Qux', false, null ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Baaz', false, '../qux/baaz.html' ) );
		} );
		await checkFile( docsDir, 'pages/qux/baaz.html', c => {
			expect( c ).toContain( '<h2>Some baaz</h2>' );
			const dom = new JSDOM( c );
			const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
			const items = Array.from( menu.querySelectorAll( 'li' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Foo', false, '../foo/index.html' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Bar', false, '../foo/bar.html' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Qux', true, null ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Baaz', true, 'baaz.html' ) );
		} );
		await checkFile( rootDir, 'docs/classes/Test.html', c => {
			const dom = new JSDOM( c );
			const menu = dom.window.document.querySelector( '.tsd-navigation.primary' )!;
			const items = Array.from( menu.querySelectorAll( 'li' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Foo', false, '../pages/foo/index.html' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Bar', false, '../pages/foo/bar.html' ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Qux', false, null ) );
			expect( items ).toContainEqual( menuItemMatcher( 'Baaz', false, '../pages/qux/baaz.html' ) );
			const link = dom.window.document.querySelector( '.tsd-comment a' );
			expect( link ).toBeTruthy();
			expect( link ).toHaveTextContent( /^(\s|<wbr\s*\/>|⇒)*Bar$/ );
			expect( link ).toHaveAttribute( 'href', '../pages/foo/bar.html' );
			expect( c ).toMatchSnapshot();
		} );
	} );
} );
