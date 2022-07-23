/* eslint-disable @typescript-eslint/no-var-requires */
import assert from 'assert';
import { relative, resolve } from 'path';

import { escapeRegExp, identity } from 'lodash';
import { Application, DeclarationReflection, MarkdownEvent, ReflectionKind, SourceReference } from 'typedoc';

jest.mock( '../base-plugin' );
const { ABasePlugin, getPlugin, getApplication } = require( '../base-plugin' ) as jest.Mocked<typeof import( '../base-plugin' )>;
getPlugin.mockImplementation( identity );
getApplication.mockImplementation( jest.requireActual( '../base-plugin' ).getApplication );

import { CurrentPageMemo } from '../current-page-memo';
import { MarkdownReplacer } from './markdown-replacer';

class TestPlugin extends ABasePlugin {
	public override application: jest.MockedObjectDeep<Application>;
	public constructor(){
		super( {} as any, __filename );
		this.application = Object.assign( Object.create( Application.prototype ), {
			renderer: {
				on: jest.fn(),
			},
			options: { freeze: jest.fn() },
		} ) as any;
		const pseudoLogger = {
			makeChildLogger: jest.fn().mockImplementation( () => pseudoLogger ),
			error: jest.fn().mockImplementation( assert.fail ),
			warn: jest.fn().mockImplementation( assert.fail ),
		} as any;
		( this as any ).logger = pseudoLogger;
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public initialize(): void {}
	public relativeToRoot( path: string ){
		return relative( process.cwd(), path );
	}
}
const mockCurrentPage = ( name: string, source: string, line: number, character: number ) => {
	const ref = new DeclarationReflection( name, ReflectionKind.Class );
	ref.sources = [
		new SourceReference( source, line, character ),
	];
	Object.defineProperty( CurrentPageMemo.prototype, 'currentReflection', { writable: true, value: ref } );
	Object.defineProperty( CurrentPageMemo.prototype, 'hasCurrent', { writable: true, value: true } );
};
afterEach( () => {
	Object.defineProperty( CurrentPageMemo.prototype, 'currentReflection', { writable: true, value: undefined } );
	Object.defineProperty( CurrentPageMemo.prototype, 'hasCurrent', { writable: true, value: false } );
} );
const getMarkdownEventParseListeners = ( plugin: TestPlugin ) => plugin.application.renderer.on.mock.calls
	.filter( c => c[0] === MarkdownEvent.PARSE )
	.map( c => c[1] );
describe( MarkdownReplacer.name, () => {
	let plugin: TestPlugin;
	let replacer: MarkdownReplacer;
	beforeEach( () => {
		plugin = new TestPlugin();
		replacer = new MarkdownReplacer( plugin );
	} );
	it( 'should replace correctly inline tag in markdown event', () =>{
		// Arrange
		mockCurrentPage( 'Test', resolve( 'hello.ts' ), 1, 1 );
		const fn = jest.fn().mockReturnValueOnce( 'REPLACE 1' ).mockReturnValueOnce( 'REPLACE 2' );
		replacer.registerMarkdownTag( '@test', /(foo)?/g, fn );
		const source = 'Hello {@test foo} {@test} @test';
		const event = new MarkdownEvent( MarkdownEvent.PARSE, source, source );
		const listeners = getMarkdownEventParseListeners( plugin );
		expect( listeners ).toHaveLength( 1 );

		// Act
		listeners[0]( event );

		// Assert
		expect( event.parsedText ).toEqual( 'Hello REPLACE 1 REPLACE 2 @test' );
		expect( fn ).toHaveBeenCalledTimes( 2 );
		expect( fn ).toHaveBeenNthCalledWith( 1, { captures: [ 'foo' ], fullMatch: 'test foo', event }, expect.toBeFunction() );
		expect( fn ).toHaveBeenNthCalledWith( 2, { captures: [ undefined ], fullMatch: 'test', event }, expect.toBeFunction() );
	} );
	it( 'should ignore excluded matches', () =>{
		// Arrange
		mockCurrentPage( 'Test', resolve( 'hello.ts' ), 1, 1 );
		const fn = jest.fn().mockReturnValueOnce( '1' ).mockReturnValueOnce( '2' ).mockReturnValueOnce( '3' );
		replacer.registerMarkdownTag( '@test', /(foo\d?)?/g, fn, { excludedMatches: [ '{@test foo1}', '{@test foo4}' ] } );
		const source = 'Hello {@test} {@test foo1} {@test foo2} {@test foo3} {@test foo4} @test';
		const event = new MarkdownEvent( MarkdownEvent.PARSE, source, source );
		const listeners = getMarkdownEventParseListeners( plugin );
		expect( listeners ).toHaveLength( 1 );

		// Act
		listeners[0]( event );

		// Assert
		expect( event.parsedText ).toEqual( 'Hello 1 {@test foo1} 2 3 {@test foo4} @test' );
		expect( fn ).toHaveBeenCalledTimes( 3 );
		expect( fn ).toHaveBeenNthCalledWith( 1, { captures: [], fullMatch: 'test', event }, expect.toBeFunction() );
		expect( fn ).toHaveBeenNthCalledWith( 2, { captures: [ 'foo2' ], fullMatch: 'test foo2', event }, expect.toBeFunction() );
		expect( fn ).toHaveBeenNthCalledWith( 3, { captures: [ 'foo3' ], fullMatch: 'test foo3', event }, expect.toBeFunction() );
	} );
	describe( 'Source map', () => {
		describe( 'Once', () => {
			it.each( [
				[ 'hello {@test ##} world', [ 'hello.ts:1:7' ]],
				[ 'hello \n{@test ## } world', [ 'hello.ts:2:1' ]],
				[ '\nhello {@test ## } world', [ 'hello.ts:2:7' ]],
				[ 'hello {@test ## } world{@test ##}\nHow are you doing ?\n{@test ##}', [ 'hello.ts:1:7', 'hello.ts:1:24', 'hello.ts:3:1' ]],
			] )( 'should match %j with sourcemaps %j', ( source, expectedMaps ) => {
				mockCurrentPage( 'Test', resolve( 'hello.ts' ), 1, 1 );
				const fn = jest.fn().mockReturnValue( '#' );
				replacer.registerMarkdownTag( '@test', /##/g, fn );
				const evt = new MarkdownEvent( MarkdownEvent.PARSE, source, source );
				const listeners = getMarkdownEventParseListeners( plugin );
				expect( listeners ).toHaveLength( 1 );
				listeners[0]( evt );
				expect( fn ).toHaveBeenCalledTimes( expectedMaps.length );
				expectedMaps.forEach( ( m, i ) => {
					expect( fn.mock.calls[i][1]() ).toStartWith( `${m} ` );
					expect( fn.mock.calls[i][1]() ).toEndWith( 'in expansion of @test)' );
				} );
			} );
		} );
	} );
	describe( 'Multi', () => {
		describe( 'Source map', () => {
			it.each( [
				[ 'hello {@tag1} world', 'Simple', [
					{ tag: '@tag1',       maps: [ { map: 'hello.ts:1:7', ctxs: [ '@tag1' ] } ], replacer: jest.fn().mockReturnValueOnce( '@' ) },
				]],
				[ 'hello {@tag1} world', 'Overlapping same size', [
					{ tag: '@tag1',       maps: [ { map: 'hello.ts:1:7', ctxs: [ '@tag1' ] } ], replacer: jest.fn().mockReturnValueOnce( '{@tag2}' ) },
					{ tag: '@tag2',       maps: [ { map: 'hello.ts:1:7', ctxs: [ '@tag1', '@tag2' ] } ], replacer: jest.fn().mockReturnValueOnce( '=' ) },
				]],
				[ 'hello {@tag1} world', 'Overlapping diff size', [
					{ tag: '@tag1',       maps: [ { map: 'hello.ts:1:7', ctxs: [ '@tag1' ] } ], replacer: jest.fn().mockReturnValueOnce( '{@tag2long}' ) },
					{ tag: '@tag2long',   maps: [ { map: 'hello.ts:1:7', ctxs: [ '@tag1', '@tag2long' ] } ], replacer: jest.fn().mockReturnValueOnce( '=' ) },
				]],
				[ 'hello {@tag1} world {@tag2}', '1=>2 + 2', [
					{ tag: '@tag1',       maps: [ { map: 'hello.ts:1:7', ctxs: [ '@tag1' ] } ], replacer: jest.fn().mockReturnValueOnce( '{@tag2}' ) },
					{ tag: '@tag2',       maps: [
						{ map: 'hello.ts:1:7', ctxs: [ '@tag1', '@tag2' ] },
						{ map: 'hello.ts:1:21', ctxs: [ '@tag2' ] },
					], replacer: jest.fn().mockReturnValueOnce( '=' ) },
				]],
				[ 'hello \n{@tag2}\n{@tag1} world ', '2 + 1=>2', [
					{ tag: '@tag1',       maps: [ { map: 'hello.ts:3:1', ctxs: [ '@tag1' ] } ], replacer: jest.fn().mockReturnValueOnce( '{@tag2}' ) },
					{ tag: '@tag2',       maps: [
						{ map: 'hello.ts:2:1', ctxs: [ '@tag2' ] },
						{ map: 'hello.ts:3:1', ctxs: [ '@tag1', '@tag2' ] },
					], replacer: jest.fn().mockReturnValueOnce( '=' ) },
				]],
				[ 'hello\n{@tag1} world\n{@tag2}\n{@tag1}', '1=>2 + 2 + 1=>2', [
					{ tag: '@tag1',       maps: [
						{ map: 'hello.ts:2:1', ctxs: [ '@tag1' ] },
						{ map: 'hello.ts:4:1', ctxs: [ '@tag1' ] },
					], replacer: jest.fn().mockReturnValue( 'Hello {@tag2}' ) },
					{ tag: '@tag2',       maps: [
						{ map: 'hello.ts:2:1', ctxs: [ '@tag1', '@tag2' ] },
						{ map: 'hello.ts:3:1', ctxs: [ '@tag2' ] },
						{ map: 'hello.ts:4:1', ctxs: [ '@tag1', '@tag2' ] },
					], replacer: jest.fn().mockReturnValue( '=' ) },
				]],
			] )( 'should match %j with sourcemaps (%s) %#', ( source, _label, binds ) => {
				mockCurrentPage( 'Test', resolve( 'hello.ts' ), 1, 1 );
				binds.forEach( b => replacer.registerMarkdownTag( b.tag as any, null, b.replacer ) );
				const evt = new MarkdownEvent( MarkdownEvent.PARSE, source, source );
				const listeners = getMarkdownEventParseListeners( plugin );
				expect( listeners ).toHaveLength( binds.length );
				binds.forEach( ( _b, i ) => listeners[i]( evt ) );
				binds.forEach( b => {
					expect( b.replacer, `Replacer ${b.tag}` ).toHaveBeenCalledTimes( b.maps.length );
					b.maps.forEach( ( m, j ) => {
						const mapStr = b.replacer.mock.calls[j][1]();
						expect( mapStr, `Replacer ${b.tag}, call ${j}` )
							.toMatch( new RegExp( `^${escapeRegExp( m.map )} \\(.*? of ${m.ctxs.map( escapeRegExp ).join( ' . ' )}\\)` ) );
					} );
				} );
			} );
		} );
	} );
} );
