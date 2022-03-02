import assert, { AssertionError } from 'assert';
import { resolve } from 'path';

import { identity } from 'lodash';
import { Application, DeclarationReflection, JSX, ReflectionKind } from 'typedoc';

import { restoreFs, setVirtualFs, setupMockMarkdownReplacer, setupMockPageMemo } from '@knodes/typedoc-plugintestbed';

/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock( './code-blocks' );
const { getCodeBlockRenderer: getCodeBlockRendererMock } = require( './code-blocks' ) as jest.Mocked<typeof import( './code-blocks' )>;
jest.mock( './code-sample-file' );
const { DEFAULT_BLOCK_NAME, readCodeSample: readCodeSampleMock } = require( './code-sample-file' ) as jest.Mocked<typeof import( './code-sample-file' )>;
/* eslint-enable @typescript-eslint/no-var-requires */

import { CodeBlockPlugin } from './plugin';
import { EBlockMode, ICodeBlock } from './types';

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
const markdownReplacerTestbed = setupMockMarkdownReplacer();
const pageMemoTestbed = setupMockPageMemo();
beforeEach( () => {
	process.chdir( rootDir );
	jest.clearAllMocks();
	application = new Application();
	plugin = new CodeBlockPlugin( application );
} );
afterEach( restoreFs );
describe( 'Behavior', () => {
	beforeEach( () => {
		markdownReplacerTestbed.captureEventRegistration();
		pageMemoTestbed.captureEventRegistration();
		plugin.initialize();
		pageMemoTestbed.setCurrentPage( 'foo.html', 'foo.ts', new DeclarationReflection( 'Foo', ReflectionKind.Class ) );
		setVirtualFs( {
			foo: {
				'qux.txt': '',
			},
		} );
	} );
	it( 'should not affect text if no code block', () => {
		const text = 'Hello world' ;
		expect( markdownReplacerTestbed.runMarkdownReplace( text ) ).toEqual( text );
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
			[ 'Mode ⇒ code block',            `{@codeblock ${file} default}`,          { renderCall: { mode: EBlockMode.DEFAULT }} ],
			[ 'Mode ⇒ foldable code block',   `{@codeblock ${file} expanded}`,         { renderCall: { mode: EBlockMode.EXPANDED }} ],
			[ 'Mode ⇒ folded code block',     `{@codeblock ${file} folded}`,           { renderCall: { mode: EBlockMode.FOLDED }} ],
			[ 'Filename ⇒ default',           `{@codeblock ${file}}`,                  { renderCall: { asFile: `./${file}` }} ],
			[ 'Filename ⇒ explicit',          `{@codeblock ${file} | hello.txt}`,      { renderCall: { asFile: 'hello.txt' }} ],
			[ 'Filename ⇒ region',            `{@codeblock ${file}#hello}`,            { renderCall: { asFile: `./${file}#13~24` }, blocks: helloRegion } ],
			[ 'Filename ⇒ region + explicit', `{@codeblock ${file}#hello | test.txt}`, { renderCall: { asFile: 'test.txt' }, blocks: helloRegion } ],
			[ 'URL ⇒ default',                `{@codeblock ${file}}`,                  { withGitHub: true, renderCall: { url: FakeGitHub.REPO_URL }} ],
			[ 'URL ⇒ region',                 `{@codeblock ${file}#hello}`,            { withGitHub: true, renderCall: { url: `${FakeGitHub.REPO_URL}#L13-L24` }, blocks: helloRegion } ],
		] )( 'Code block "%s"', ( _label, source, { expected, renderCall, blocks, withGitHub } ) => {
			application.logger.error = assert.fail;
			application.logger.warn = assert.fail;
			if( withGitHub ){
				application.converter.addComponent( 'git-hub', FakeGitHub as any );
			}
			readCodeSampleMock.mockReturnValue( new Map( blocks ?? [[ DEFAULT_BLOCK_NAME, { code, startLine: 1, endLine: 1 } ]] ) );
			const { elemStr, renderCodeBlock } = setup( uuid => JSX.createElement( 'p', {}, uuid ) );
			const callOut = markdownReplacerTestbed.runMarkdownReplace( source );
			expect( getCodeBlockRendererMock ).toHaveBeenCalledTimes( 1 );
			expect( renderCodeBlock ).toHaveBeenCalledTimes( 1 );
			expect( renderCodeBlock ).toHaveBeenCalledWith( expect.objectContaining( renderCall ) );
			if( withGitHub ){
				expect( FakeGitHub.getGitHubURL ).toHaveBeenCalledTimes( 1 );
				expect( FakeGitHub.getGitHubURL ).toHaveBeenCalledWith( sourceFile );
				expect( FakeGitHub.getRepository ).toHaveBeenCalledTimes( 1 );
				expect( FakeGitHub.getRepository ).toHaveBeenCalledWith( sourceFile );
			}
			expect( callOut ).toEqual( ( expected ?? identity )( elemStr ) );
		} );
		it( 'should throw if region does not exists', () => {
			setVirtualFs( { foo: { 'bar.txt': '' }} );
			setup( uuid => JSX.createElement( 'p', {}, uuid ) );
			readCodeSampleMock.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code, startLine: 1, endLine: 1 } ]] ) );
			expect( () => markdownReplacerTestbed.runMarkdownReplace( '{@codeblock foo/bar.txt#nope}' ) ).toThrowWithMessage( Error, /^Missing block nope/ );
		} );
		it( 'should throw if invalid mode', () => {
			setup( uuid => JSX.createElement( 'p', {}, uuid ) );
			readCodeSampleMock.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code, startLine: 1, endLine: 1 } ]] ) );
			expect( () => markdownReplacerTestbed.runMarkdownReplace( '{@codeblock foo/bar.txt asdasd}' ) ).toThrowWithMessage( AssertionError, /^Invalid block mode "asdasd"/ );
		} );
	} );
} );
