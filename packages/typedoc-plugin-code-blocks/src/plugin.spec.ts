import { join, resolve } from 'path';

import { identity } from 'lodash';
import mockFs from 'mock-fs';
import { Application, JSX } from 'typedoc';

/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock( './code-blocks' );
const { getCodeBlockRenderer: getCodeBlockRendererMock } = require( './code-blocks' ) as jest.Mocked<typeof import( './code-blocks' )>;
jest.mock( './code-sample-file' );
const { readCodeSample: readCodeSampleMock } = require( './code-sample-file' ) as jest.Mocked<typeof import( './code-sample-file' )>;
/* eslint-enable @typescript-eslint/no-var-requires */

import { DEFAULT_BLOCK_NAME } from './code-sample-file';
import { CodeBlockPlugin } from './plugin';
import { ICodeBlock } from './theme';

class FakeGitHub {
	public static readonly REPO_URL = 'https://example.repo.com';
	public static readonly getGitHubURL = jest.fn().mockReturnValue( FakeGitHub.REPO_URL );
	public static readonly getRepository = jest.fn().mockReturnValue( { getGitHubURL: this.getGitHubURL } );
	public readonly getGitHubURL = FakeGitHub.getGitHubURL;
	public readonly getRepository = FakeGitHub.getRepository;
}
let application: Application;
let plugin: CodeBlockPlugin;
const rootDir = resolve( __dirname, '..' );
const DIRECTORIES = 'pluginCodeBlocks:directories';
beforeEach( () => {
	process.chdir( rootDir );
	jest.clearAllMocks();
	application = new Application();
	plugin = new CodeBlockPlugin( application );
	plugin.initialize();
} );
afterEach( mockFs.restore );
describe( 'Options', () => {
	const base = 'test';
	const tryOption = ( value: any ) => {
		const baseGetValue = application.options.getValue.bind( application.options );
		jest.spyOn( application.options, 'getValue' ).mockImplementation( k => k === 'options' ? base : baseGetValue( k ) );
		application.options.setValue( DIRECTORIES, value );
		// eslint-disable-next-line @typescript-eslint/dot-notation
		return plugin['_directoriesOption'].getValue();
	};
	describe( DIRECTORIES, () => {
		it.each( [ 42, true, [], false ] )( 'should throw an error if not an object (%j)', v =>
			expect( () => tryOption( v ) ).toThrow() );
		it.each( [ 42, true, {}, []] )( 'should throw if value is not a string (%j)', v =>
			expect( () => tryOption( { v } ) ).toThrow() );
		it.each( [ '/', ' ' ] )( 'should throw an error if it contains invalid key (%j)', k =>
			expect( () => tryOption( { [k]: './test' } ) ).toThrow() );
		it.each( [ '/foo', '/bar' ] )( 'should throw an error if the path does not exist (%j)', path => {
			mockFs( { [base]: {}} );
			expect( () => tryOption( { foo: path } ) ).toThrow();
		} );
		it( 'should throw if trying to set a forbidden value ~~', () => {
			mockFs( { [base]: { hello: {}}} );
			expect( () => tryOption( { '~~': './hello' } ) ).toThrow();
		} );
		it.each( [
			[ null,  { '~~': base } ],
			[ undefined,  { '~~': base } ],
			[ { hello: './hello', world: './world' },  {
				'hello': join( base, 'hello' ),
				'world': join( base, 'world' ),
				'~~': base,
			} ],
		] )( 'should pass with valid options (%j ⇒ %j)', ( input, output ) => {
			mockFs( { [base]: {
				hello: {},
				world: {},
			}} );
			expect( tryOption( input ) ).toEqual( output );
		} );
	} );
} );
describe( 'Behavior', () => {
	beforeEach( () => {
		mockFs( {
			foo: {},
		} );
		application.options.setValue( DIRECTORIES, { foo: './foo' } );
	} );
	it( 'should not affect text if no code block', () => {
		const text = 'Hello world' ;
		expect( plugin.replaceCodeBlocks( text ) ).toEqual( text );
	} );
	describe( 'Code block generation', ()=> {
		const file = 'foo/qux.txt';
		const code = `Content of ${file}`;
		const setup = ( factory: ( uuid: string ) => JSX.Element ) => {
			const uuid = new Date().toISOString();
			const elem = factory( uuid );
			const renderCodeBlock = jest.fn<JSX.Element, [ICodeBlock]>().mockReturnValue( elem );
			getCodeBlockRendererMock.mockReturnValue( { renderCodeBlock } );
			return { renderCodeBlock, elem, elemStr: JSX.renderElement( elem ) };
		};
		const sourceFile = resolve( rootDir, file );
		interface IBlockGenerationAssertion{
			expected: ( elemStr: string ) => string;
			renderCall: Partial<ICodeBlock>;
			blocks: Array<[string, {code: string;startLine: number;endLine: number}]>;
			withGitHub: boolean;
		}
		const helloRegion: IBlockGenerationAssertion['blocks'] = [[ 'hello', { code: 'Content of foo/qux.txt', startLine: 13, endLine: 24 } ]];
		it.each<[label: string, source: string, assertion: Partial<IBlockGenerationAssertion>]>( [
			[ 'Mode ⇒ code block',            `{@codeblock ${file}}`,                  { renderCall: { mode: null }} ],
			[ 'Mode ⇒ foldable code block',   `{@codeblock foldable ${file}}`,         { renderCall: { mode: 'foldable' }} ],
			[ 'Mode ⇒ folded code block',     `{@codeblock folded ${file}}`,           { renderCall: { mode: 'folded' }} ],
			[ 'Filename ⇒ default',           `{@codeblock ${file}}`,                  { renderCall: { asFile: `./${file}` }} ],
			[ 'Filename ⇒ explicit',          `{@codeblock ${file} | hello.txt}`,      { renderCall: { asFile: 'hello.txt' }} ],
			[ 'Filename ⇒ region',            `{@codeblock ${file}#hello}`,            { renderCall: { asFile: `./${file}#13~24` }, blocks: helloRegion } ],
			[ 'Filename ⇒ region + explicit', `{@codeblock ${file}#hello | test.txt}`, { renderCall: { asFile: 'test.txt' }, blocks: helloRegion } ],
			[ 'URL ⇒ default',                `{@codeblock ${file}}`,                  { withGitHub: true, renderCall: { url: FakeGitHub.REPO_URL }} ],
			[ 'URL ⇒ region',                 `{@codeblock ${file}#hello}`,            { withGitHub: true, renderCall: { url: `${FakeGitHub.REPO_URL}#L13-L24` }, blocks: helloRegion } ],
		] )( 'Code block "%s"', ( _label, source, { expected, renderCall, blocks, withGitHub } ) => {
			if( withGitHub ){
				application.converter.addComponent( 'git-hub', new FakeGitHub() as any );
			}
			readCodeSampleMock.mockReturnValue( new Map( blocks ?? [[ DEFAULT_BLOCK_NAME, { code, startLine: 1, endLine: 1 } ]] ) );
			const { elemStr, renderCodeBlock } = setup( uuid => JSX.createElement( 'p', {}, uuid ) );
			expect( plugin.replaceCodeBlocks( source ) ).toEqual( ( expected ?? identity )( elemStr ) );
			expect( getCodeBlockRendererMock ).toHaveBeenCalledTimes( 1 );
			expect( renderCodeBlock ).toHaveBeenCalledTimes( 1 );
			expect( renderCodeBlock ).toHaveBeenCalledWith( expect.objectContaining( renderCall ) );
			if( withGitHub ){
				expect( FakeGitHub.getGitHubURL ).toHaveBeenCalledTimes( 1 );
				expect( FakeGitHub.getGitHubURL ).toHaveBeenCalledWith( sourceFile );
				expect( FakeGitHub.getRepository ).toHaveBeenCalledTimes( 1 );
				expect( FakeGitHub.getRepository ).toHaveBeenCalledWith( sourceFile );
			}
		} );
		it( 'should throw if region does not exists', () => {
			setup( uuid => JSX.createElement( 'p', {}, uuid ) );
			readCodeSampleMock.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code, startLine: 1, endLine: 1 } ]] ) );
			expect( () => plugin.replaceCodeBlocks( '{@codeblock foo/bar.txt#nope}' ) ).toThrowWithMessage( Error, /^Missing block nope/ );
		} );
		it( 'should throw if code block dir does not exists', () => {
			setup( uuid => JSX.createElement( 'p', {}, uuid ) );
			readCodeSampleMock.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code, startLine: 1, endLine: 1 } ]] ) );
			expect( () => plugin.replaceCodeBlocks( '{@codeblock bar/bar.txt}' ) ).toThrowWithMessage( Error, /^Trying to use code block from named directory bar/ );
			expect( readCodeSampleMock ).not.toHaveBeenCalled();
		} );
	} );
} );
