import { resolve } from 'path';

import mockFs from 'mock-fs';
import { Application, MarkdownEvent } from 'typedoc';

/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock( 'marked' );
const { marked, Renderer } = require( 'marked' ) as jest.Mocked<typeof import( 'marked' )>;
jest.mock( './code-sample-file' );
const { readCodeSample } = require( './code-sample-file' ) as jest.Mocked<typeof import( './code-sample-file' )>;
/* eslint-enable @typescript-eslint/no-var-requires */

import { CodeBlockPlugin } from './code-block-plugin';
import { DEFAULT_BLOCK_NAME } from './code-sample-file';
import { DIRECTORY } from './options';

let application: Application;
let plugin: CodeBlockPlugin;
const rootDir = resolve( __dirname, '..' );
beforeEach( () => {
	process.chdir( rootDir );
	jest.clearAllMocks();
	application = new Application();
	plugin = new CodeBlockPlugin( application );
} );
afterEach( mockFs.restore );
describe( 'Options', () => {
	describe( DIRECTORY, () => {
		it( 'should throw an error if value is not an object', () => {
			expect( () => application.options.setValue( DIRECTORY, null ) ).toThrow();
			expect( () => application.options.setValue( DIRECTORY, undefined ) ).toThrow();
			expect( () => application.options.setValue( DIRECTORY, [] ) ).toThrow();
			expect( () => application.options.setValue( DIRECTORY, 42 ) ).toThrow();
			expect( () => application.options.setValue( DIRECTORY, 'foo' ) ).toThrow();
		} );
		it.each( [ '/', ' ' ] )( 'should throw an error if it contains invalid key', k => {
			expect( () => application.options.setValue( DIRECTORY, { [k]: './test' } ) ).toThrow();
		} );
		it.each( [ '/test', 'hello' ] )( 'should throw an error if a value is not a relative path', path => {
			expect( () => application.options.setValue( DIRECTORY, { foo: path } ) ).toThrow();
		} );
		it.each( [ '/foo', '/bar' ] )( 'should throw an error if the path does not exist', path => {
			// existsSpy.mockReturnValue( false );
			expect( () => application.options.setValue( DIRECTORY, { foo: path } ) ).toThrow();
		} );
		it( 'should pass with valid options', () => {
			mockFs( {
				hello: {},
				world: {},
			} );
			application.options.setValue( DIRECTORY, { hello: './hello', world: './world' } );
		} );
	} );
} );
describe( 'Behavior', () => {
	const CSS_FS = {
		static: {
			'code-block.css': '@CSS',
		},
	};
	beforeEach( () => {
		marked.mockImplementation( src => `##(${src})##` );
		Renderer.prototype.code.mockImplementation( code => `@@(${code})@@` );
		mockFs( {
			...CSS_FS,
			foo: {},
		} );
		application.options.setValue( DIRECTORY, { foo: './foo' } );
	} );
	it( 'should not affect text if no code block', () => {
		const event = new MarkdownEvent( MarkdownEvent.PARSE, '', 'Hello world' );
		const eventBck = { ...event };
		plugin.processMarkdown( event );
		expect( event ).toEqual( eventBck );
	} );
	describe( 'Code block wrapper generation', ()=> {
		it( 'should output a code block', () => {
			readCodeSample.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code: 'Content of foo/qux.txt', startLine: 1, endLine: 1 } ]] ) );
			const event = new MarkdownEvent( MarkdownEvent.PARSE, '', '*Hello world !*\n\n{@codeblock foo/qux.txt}' );
			plugin.processMarkdown( event );
			expect( event.parsedText ).toMatchInlineSnapshot( `
"<style>@CSS</style>

*Hello world !*

<div class=\\"code-block\\">##(From ./foo/qux.txt)##@@(Content of foo/qux.txt)@@</div>"
` );
		} );
		it( 'should output a folded code block', () => {
			readCodeSample.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code: 'Content of foo/qux.txt', startLine: 1, endLine: 1 } ]] ) );
			const event = new MarkdownEvent( MarkdownEvent.PARSE, '', '*Hello world !*\n\n{@codeblock folded foo/qux.txt}' );
			plugin.processMarkdown( event );
			expect( event.parsedText ).toMatchInlineSnapshot( `
"<style>@CSS</style>

*Hello world !*

<details class=\\"code-block\\"><summary>##(From ./foo/qux.txt)##</summary>@@(Content of foo/qux.txt)@@</details>"
` );
		} );
		it( 'should output a foldable code block', () => {
			readCodeSample.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code: 'Content of foo/qux.txt', startLine: 1, endLine: 1 } ]] ) );
			const event = new MarkdownEvent( MarkdownEvent.PARSE, '', '*Hello world !*\n\n{@codeblock foldable foo/qux.txt}' );
			plugin.processMarkdown( event );
			expect( event.parsedText ).toMatchInlineSnapshot( `
"<style>@CSS</style>

*Hello world !*

<details class=\\"code-block\\" open=\\"open\\"><summary>##(From ./foo/qux.txt)##</summary>@@(Content of foo/qux.txt)@@</details>"
` );
		} );
	} );
	describe( 'Header generation', () => {
		const extractHeader = ( event: MarkdownEvent ) => {
			const matchComplex = event.parsedText.match( /##\(From \[(.+?)\]\((.+?)\)\)##/ );
			if( matchComplex ){
				return {
					file: matchComplex[1],
					url: matchComplex[2],
				};
			}
			const matchSimple = event.parsedText.match( /##\(From (.+?)\)##/ );
			if( matchSimple ){
				return {
					file: matchSimple[1],
					url: matchSimple[2],
				};
			}
			throw new Error();
		};
		class FakeGitHub {
			public static readonly REPO_URL = 'https://example.repo.com';
			public static readonly getGitHubURL = jest.fn().mockReturnValue( FakeGitHub.REPO_URL );
			public static readonly getRepository = jest.fn().mockReturnValue( { getGitHubURL: this.getGitHubURL } );
			public readonly getGitHubURL = FakeGitHub.getGitHubURL;
			public readonly getRepository = FakeGitHub.getRepository;
		}
		describe( 'Filename', () => {
			it( 'should generate the correct default header', () => {
				readCodeSample.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code: 'Content of foo/qux.txt', startLine: 1, endLine: 1 } ]] ) );
				const event = new MarkdownEvent( MarkdownEvent.PARSE, '', '*Hello world !*\n\n{@codeblock foo/qux.txt}' );
				plugin.processMarkdown( event );
				expect( extractHeader( event ) ).toEqual( {
					file: './foo/qux.txt',
					url: undefined,
				} );
			} );
			it( 'should generate the correct header with explicit name', () => {
				readCodeSample.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code: 'Content of foo/qux.txt', startLine: 1, endLine: 1 } ]] ) );
				const event = new MarkdownEvent( MarkdownEvent.PARSE, '', '*Hello world !*\n\n{@codeblock foo/qux.txt | test.txt}' );
				plugin.processMarkdown( event );
				expect( extractHeader( event ) ).toEqual( {
					file: 'test.txt',
					url: undefined,
				} );
			} );
			it( 'should generate the correct header with region', () => {
				readCodeSample.mockReturnValue( new Map( [[ 'hello', { code: 'Content of foo/qux.txt', startLine: 13, endLine: 24 } ]] ) );
				const event = new MarkdownEvent( MarkdownEvent.PARSE, '', '*Hello world !*\n\n{@codeblock foo/qux.txt#hello}' );
				plugin.processMarkdown( event );
				expect( extractHeader( event ) ).toEqual( {
					file: './foo/qux.txt#13~24',
					url: undefined,
				} );
			} );
			it( 'should generate the correct header with region & explicit name', () => {
				readCodeSample.mockReturnValue( new Map( [[ 'hello', { code: 'Content of foo/qux.txt', startLine: 13, endLine: 24 } ]] ) );
				const event = new MarkdownEvent( MarkdownEvent.PARSE, '', '*Hello world !*\n\n{@codeblock foo/qux.txt#hello | test.txt}' );
				plugin.processMarkdown( event );
				expect( extractHeader( event ) ).toEqual( {
					file: 'test.txt',
					url: undefined,
				} );
			} );
		} );
		describe( 'URL', () => {
			beforeEach( () => {
				application.converter.addComponent( 'git-hub', new FakeGitHub() as any );
			} );
			const file = resolve( rootDir, 'foo/qux.txt' );
			it( 'should generate the correct default URL', () => {
				readCodeSample.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code: 'Content of foo/qux.txt', startLine: 1, endLine: 1 } ]] ) );
				const event = new MarkdownEvent( MarkdownEvent.PARSE, '', '*Hello world !*\n\n{@codeblock foo/qux.txt | test.txt}' );
				plugin.processMarkdown( event );
				expect( extractHeader( event ).url ).toEqual( `${FakeGitHub.REPO_URL}` );
				expect( FakeGitHub.getGitHubURL ).toHaveBeenCalledTimes( 1 );
				expect( FakeGitHub.getGitHubURL ).toHaveBeenCalledWith( file );
				expect( FakeGitHub.getRepository ).toHaveBeenCalledTimes( 1 );
				expect( FakeGitHub.getRepository ).toHaveBeenCalledWith( file );
			} );
			it( 'should generate the correct URL with region', () => {
				readCodeSample.mockReturnValue( new Map( [[ 'hello', { code: 'Content of foo/qux.txt', startLine: 13, endLine: 24 } ]] ) );
				const event = new MarkdownEvent( MarkdownEvent.PARSE, '', '*Hello world !*\n\n{@codeblock foo/qux.txt#hello | test.txt}' );
				plugin.processMarkdown( event );
				expect( extractHeader( event ).url ).toEqual( `${FakeGitHub.REPO_URL}#L13-L24` );
				expect( FakeGitHub.getGitHubURL ).toHaveBeenCalledTimes( 1 );
				expect( FakeGitHub.getGitHubURL ).toHaveBeenCalledWith( file );
				expect( FakeGitHub.getRepository ).toHaveBeenCalledTimes( 1 );
				expect( FakeGitHub.getRepository ).toHaveBeenCalledWith( file );
			} );
		} );
	} );
} );
