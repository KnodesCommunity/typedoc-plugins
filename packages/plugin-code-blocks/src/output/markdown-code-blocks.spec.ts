import { noop } from 'lodash';
import { DeclarationReflection, ReflectionKind, RepositoryType, normalizePath } from 'typedoc';

import { resolve } from '@knodes/typedoc-pluginutils/path';

import { MockPlugin, createMockProjectWithPackage, mockPlugin, restoreFs, setVirtualFs, setupMockMarkdownReplacer, setupMockPageMemo } from '#plugintestbed';

/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock( '../code-sample-file' );
const { DEFAULT_BLOCK_NAME, readCodeSample: readCodeSampleMock } = require( '../code-sample-file' ) as jest.Mocked<typeof import( '../code-sample-file' )>;
/* eslint-enable @typescript-eslint/no-var-requires */

import { CodeBlockPlugin } from '../plugin';
import { EBlockMode, ICodeBlock } from '../types';
import { MarkdownCodeBlocks } from './markdown-code-blocks';
import { ICodeBlocksPluginThemeMethods } from './theme';

class FakeSource {
	public static readonly REPO_URL = 'https://example.repo.com';
	public static readonly getURL = jest.fn().mockReturnValue( FakeSource.REPO_URL );
	public static readonly getRepository = jest.fn().mockReturnValue( {
		getURL: this.getURL,
		type: RepositoryType.GitHub,
		getLineNumberAnchor: jest.fn().mockImplementation( v => `L${v}` ),
	} );
	public readonly getURL = FakeSource.getURL;
	public readonly getRepository = FakeSource.getRepository;
}
let themeMethods: ICodeBlocksPluginThemeMethods;
let plugin: MockPlugin<CodeBlockPlugin>;
const rootDir = resolve( __dirname, '../..' );
const markdownReplacerTestbed = setupMockMarkdownReplacer();
const pageMemoTestbed = setupMockPageMemo();
const FILE = 'foo/qux.txt';
const FILE_CONTENT = `Content of ${FILE}`;
beforeEach( () => {
	process.chdir( rootDir );
	jest.clearAllMocks();
	let i = 0;
	themeMethods = {
		renderCodeBlock: jest.fn().mockImplementation( () => `renderCodeBlock-${i++}` ),
		renderInlineCodeBlock: jest.fn().mockImplementation( () => `renderInlineCodeBlock-${i++}` ),
	};
	markdownReplacerTestbed.captureEventRegistration();
	pageMemoTestbed.captureEventRegistration();
	setVirtualFs( {
		'foo': {
			'qux.txt': '',
		},
		'package.json': '',
	} );
	plugin = mockPlugin<CodeBlockPlugin>();
	plugin.application.converter.removeAllComponents();
	new MarkdownCodeBlocks( plugin, themeMethods );
	const ref = new DeclarationReflection( 'Foo', ReflectionKind.Class, createMockProjectWithPackage() );
	pageMemoTestbed.setCurrentPage( 'foo.html', 'foo.ts', ref );
} );
afterEach( restoreFs );
describe( 'Behavior', () => {
	it( 'should not affect text if no code block', () => {
		const text = 'Hello world';
		expect( markdownReplacerTestbed.runMarkdownReplace( text ) ).toEqual( text );
	} );
	describe( 'Code block generation', ()=> {
		const sourceFile = normalizePath( resolve( rootDir, FILE ) );
		interface IBlockGenerationAssertion{
			renderCall: Partial<ICodeBlock>;
			blocks: Array<[string, {code: string;startLine: number;endLine: number}]>;
			withGitHub: boolean;
		}
		const defaultBlock = { startLine: 1, endLine: 1, file: FILE, region: DEFAULT_BLOCK_NAME as string };
		const helloRegion: IBlockGenerationAssertion['blocks'] = [[ 'hello', { code: 'Content of foo/qux.txt', startLine: 13, endLine: 24 } ]];
		it.each<[label: string, source: string, assertion: Partial<IBlockGenerationAssertion>]>( [
			[ 'Mode ⇒ code block',            `{@codeblock ${FILE} default}`,          { renderCall: { mode: EBlockMode.DEFAULT }} ],
			[ 'Mode ⇒ foldable code block',   `{@codeblock ${FILE} expanded}`,         { renderCall: { mode: EBlockMode.EXPANDED }} ],
			[ 'Mode ⇒ folded code block',     `{@codeblock ${FILE} folded}`,           { renderCall: { mode: EBlockMode.FOLDED }} ],
			[ 'Filename ⇒ default',           `{@codeblock ${FILE}}`,                  { renderCall: { asFile: `./${FILE}` }} ],
			[ 'Filename ⇒ explicit',          `{@codeblock ${FILE} | hello.txt}`,      { renderCall: { asFile: 'hello.txt' }} ],
			[ 'Filename ⇒ region',            `{@codeblock ${FILE}#hello}`,            { renderCall: { asFile: `./${FILE}#13~24` }, blocks: helloRegion } ],
			[ 'Filename ⇒ region + explicit', `{@codeblock ${FILE}#hello | test.txt}`, { renderCall: { asFile: 'test.txt' }, blocks: helloRegion } ],
			[ 'URL ⇒ default',                `{@codeblock ${FILE}}`,                  { withGitHub: true, renderCall: { url: FakeSource.REPO_URL }} ],
			[ 'URL ⇒ region',                 `{@codeblock ${FILE}#hello}`,            { withGitHub: true, renderCall: { url: `${FakeSource.REPO_URL}#L13-L24` }, blocks: helloRegion } ],
		] )( 'Code block "%s"', ( _label, source, { renderCall, blocks, withGitHub } ) => {
			if( withGitHub ){
				plugin.application.converter.addComponent( 'source', FakeSource as any );
			}
			readCodeSampleMock.mockReturnValue( new Map( blocks?.map( ( [ name, b ] ) => [
				name,
				{ ...b, file: FILE, region: name } ] as const ) ?? [[ DEFAULT_BLOCK_NAME, { code: FILE_CONTENT, ...defaultBlock } ]] ) );
			const callOut = markdownReplacerTestbed.runMarkdownReplace( source );
			expect( themeMethods.renderCodeBlock ).toHaveBeenCalledTimes( 1 );
			expect( themeMethods.renderCodeBlock ).toHaveBeenCalledWith( expect.objectContaining( renderCall ) );
			if( withGitHub ){
				expect( FakeSource.getURL ).toHaveBeenCalledTimes( 2 );
				expect( FakeSource.getURL ).toHaveBeenCalledWith( sourceFile );
				expect( FakeSource.getRepository ).toHaveBeenCalledTimes( 2 );
				expect( FakeSource.getRepository ).toHaveBeenCalledWith( sourceFile );
			}
			expect( callOut ).toEqual( 'renderCodeBlock-0' );
			expect( plugin.logger.error ).not.toHaveBeenCalled();
			expect( plugin.logger.warn ).not.toHaveBeenCalled();
		} );
		it( 'should not alter content if region does not exists', () => {
			readCodeSampleMock.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code: FILE_CONTENT, ...defaultBlock } ]] ) );
			const content = '{@codeblock foo/baz.txt#nope}';
			plugin.logger.error.mockImplementation( noop );
			expect( markdownReplacerTestbed.runMarkdownReplace( content ) ).toEqual( content );
		} );
		it( 'should throw if invalid mode', () => {
			plugin.logger.error.mockImplementation( noop );
			setVirtualFs( { foo: { 'bar.txt': '' }} );
			readCodeSampleMock.mockReturnValue( new Map( [[ DEFAULT_BLOCK_NAME, { code: FILE_CONTENT, ...defaultBlock } ]] ) );
			const content = '{@codeblock foo/bar.txt asdasd}';
			expect( markdownReplacerTestbed.runMarkdownReplace( content ) ).toEqual( content );
			expect( plugin.logger.error ).toHaveBeenCalledTimes( 1 );
			expect( plugin.logger.error ).toHaveBeenCalledWith( expect.toSatisfy( fn => {
				expect( fn() ).toEqual( 'In "foo.ts:1:1" (in expansion of @codeblock): Failed to render code block from Foo: Invalid block mode "asdasd".' );
				return true;
			} ) );
		} );
	} );
} );
