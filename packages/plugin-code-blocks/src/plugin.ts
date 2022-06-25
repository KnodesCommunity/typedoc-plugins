import assert from 'assert';
import { relative } from 'path';

import { escapeRegExp, isString, once } from 'lodash';
import { Application, JSX, LogLevel, normalizePath } from 'typedoc';

import { ABasePlugin, CurrentPageMemo, EventsExtra, MarkdownReplacer, PathReflectionResolver } from '@knodes/typedoc-pluginutils';

import { getCodeBlockRenderer } from './code-blocks';
import { DEFAULT_BLOCK_NAME, ICodeSample, readCodeSample } from './code-sample-file';
import { buildOptions } from './options';
import { CodeBlockReflection } from './reflections';
import { EBlockMode } from './types';

const EXTRACT_CODE_BLOCKS_REGEX = /codeblock\s+(\S+?\w+?)(?:#(.+?))?(?:\s+(\w+))?(?:\s*\|\s*(.*?))?\s*/g;
const EXTRACT_INLINE_CODE_BLOCKS_REGEX = /\{\\?@inline-codeblock\s+(\S+?\w+?)(?:\s+(\w+))?\s*}\n(\s*)(```.*?```)/gs;
/**
 * Pages plugin for integrating your own pages into documentation output
 */
export class CodeBlockPlugin extends ABasePlugin {
	public readonly pluginOptions = buildOptions( this );
	private readonly _codeBlockRenderer = once( () => getCodeBlockRenderer( this.application, this ) );
	private readonly _currentPageMemo = CurrentPageMemo.for( this );
	private readonly _markdownReplacer = new MarkdownReplacer( this );
	private readonly _pathReflectionResolver = new PathReflectionResolver( this );
	private readonly _fileSamples = new Map<string, Map<string, ICodeSample>>();

	public constructor( application: Application ){
		super( application, __filename );
	}

	/**
	 * This method is called after the plugin has been instanciated.
	 *
	 * @see {@link import('@knodes/typedoc-pluginutils').autoload}.
	 */
	public initialize(): void {
		// Hook over each markdown events to replace code blocks
		this._markdownReplacer.bindTag( EXTRACT_CODE_BLOCKS_REGEX, this._replaceCodeBlock.bind( this ), '{@codeblock}' );
		this._markdownReplacer.bindReplace( EXTRACT_INLINE_CODE_BLOCKS_REGEX, this._replaceInlineCodeBlock.bind( this ), '{@inline-codeblock}' );
		this._currentPageMemo.initialize();
		EventsExtra.for( this.application )
			.onThemeReady( this._codeBlockRenderer.bind( this ) )
			.onSetOption( `${this.optionsPrefix}:logLevel`, v => {
				this.logger.level = v as LogLevel;
			} );
	}

	/**
	 * Transform the parsed inline code block.
	 *
	 * @param capture - The captured infos.
	 * @param sourceHint - The best guess to the source of the match,
	 * @returns the replaced content.
	 */
	private _replaceInlineCodeBlock( { captures, fullMatch }: MarkdownReplacer.ReplaceMatch, sourceHint: MarkdownReplacer.SourceHint ) {
		// Support escaped tags
		if( fullMatch.startsWith( '{\\@' ) ){
			this.logger.verbose( () => `Found an escaped tag "${fullMatch}" in "${sourceHint()}"` );
			return fullMatch.replace( '{\\@', '{@' );
		}
		// Extract informations
		const [ fileName, blockModeStr, blockIndent, markdownCodeSource ] = captures;
		assert.ok( fileName );
		assert.ok( markdownCodeSource );
		assert.ok( isString( blockIndent ) );
		const markdownCode = markdownCodeSource.replace( new RegExp( `^${escapeRegExp( blockIndent )}`, 'gm' ), '' );

		// Render
		const rendered = this._codeBlockRenderer().renderInlineCodeBlock( {
			fileName,
			markdownCode,
			mode: this._getBlockMode( blockModeStr ),
		} );
		if( typeof rendered === 'string' ){
			return rendered;
		} else {
			return JSX.renderElement( rendered );
		}
	}

	/**
	 * Transform the parsed code block.
	 *
	 * @param capture - The captured infos.
	 * @param sourceHint - The best guess to the source of the match,
	 * @returns the replaced content.
	 */
	private _replaceCodeBlock( { captures, fullMatch }: MarkdownReplacer.ReplaceMatch, sourceHint: MarkdownReplacer.SourceHint ) {
		// Avoid recursion in code blocks
		if( this._currentPageMemo.currentReflection instanceof CodeBlockReflection ){
			return `{@${fullMatch}}`;
		}
		// Extract informations
		const [ file, block, blockModeStr, fakedFileName ] = captures;
		assert.ok( file );
		const codeSampleInfos = this._getCodeSampleInfos( file, block, sourceHint );
		if( codeSampleInfos === null ){
			return fullMatch;
		}
		const { codeSample, resolvedFile } = codeSampleInfos;

		// Render
		const headerFileName = fakedFileName ?? this._getHeaderFileName( resolvedFile, codeSample );
		const url = this._resolveCodeSampleUrl( resolvedFile, codeSample.region === DEFAULT_BLOCK_NAME ? null : codeSample );
		return this._currentPageMemo.fakeWrapPage(
			codeSample.file,
			new CodeBlockReflection( codeSample.region, codeSample.file, codeSample.code, codeSample.startLine, codeSample.endLine ),
			() => {
				const rendered = this._codeBlockRenderer().renderCodeBlock( {
					asFile: headerFileName,
					content: codeSample.code,
					mode: this._getBlockMode( blockModeStr ),
					sourceFile: resolvedFile,
					url,
				} );
				if( typeof rendered === 'string' ){
					return rendered;
				} else {
					return JSX.renderElement( rendered );
				}
			} );
	}

	/**
	 * Generate the code block header file name.
	 *
	 * @param file - The path to the code sample file.
	 * @param codeSample - The code sample infos.
	 * @returns the file name to show in the header.
	 */
	private _getHeaderFileName( file: string, codeSample: ICodeSample ): string {
		const filePath = normalizePath( relative( this.rootDir, file ) );
		const regionMarker = codeSample.region === DEFAULT_BLOCK_NAME ? '' : `#${codeSample.startLine}~${codeSample.endLine}`;
		return `./${filePath}${regionMarker}`;
	}

	/**
	 * Find the {@link block} in the {@link file}, and returns the sample along with search resolution infos.
	 *
	 * @param file - The file to look for {@link block}.
	 * @param block - The name of the block in the {@link file}.
	 * @param sourceHint - The best guess to the source of the match,
	 * @returns the code sample & its path if found, null if the file is not found.
	 */
	private _getCodeSampleInfos( file: string, block: string | null, sourceHint: MarkdownReplacer.SourceHint ){
		const defaultedBlock = block ?? DEFAULT_BLOCK_NAME; // TODO: Use ??= once on node>14
		const resolvedFile = this._pathReflectionResolver.resolveNamedPath(
			this._currentPageMemo.currentReflection.project,
			file,
			{
				currentReflection: this._currentPageMemo.currentReflection,
				containerFolder: this.pluginOptions.getValue().source,
			} );
		if( !resolvedFile ){
			this.logger.error( () => `In "${sourceHint()}", could not resolve file "${file}" from ${this._currentPageMemo.currentReflection.name}` );
			return null;
		} else {
			this.logger.verbose( () => `Created a code block to ${this.relativeToRoot( resolvedFile )} from "${sourceHint()}"` );
		}
		// Get the actual code sample
		if( !this._fileSamples.has( resolvedFile ) ){
			this._fileSamples.set( resolvedFile, readCodeSample( resolvedFile ) );
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Set above
		const fileSample = this._fileSamples.get( resolvedFile )!;
		const codeSample = fileSample?.get( defaultedBlock );
		assert( codeSample, new Error( `Missing block ${defaultedBlock} in ${resolvedFile}` ) );
		return { codeSample, resolvedFile };
	}

	/**
	 * Parse the mode string to a valid enum member {@link EBlockMode}. If the mode string is null, empty or undefined, returns the default block mode.
	 *
	 * @param modeStr - The raw input block mode.
	 * @returns the {@link EBlockMode} infered from input.
	 */
	private _getBlockMode( modeStr?: string | null ) {
		return modeStr ?
			EBlockMode[modeStr.toUpperCase() as keyof typeof EBlockMode] ?? assert.fail( `Invalid block mode "${modeStr}".` ) :
			this.pluginOptions.getValue().defaultBlockMode ?? EBlockMode.EXPANDED;
	}

	/**
	 * Try to get the URL to the given {@link file}, optionally ranging the {@link codeSample}.
	 *
	 * @param file - The file to resolve.
	 * @param codeSample - The code sample containing the lines range to select.
	 * @returns the URL, or `null`.
	 */
	private _resolveCodeSampleUrl( file: string, codeSample: ICodeSample | null ): string | undefined {
		const gitHubComponent = this.application.converter.getComponent( 'git-hub' );
		if( !gitHubComponent ){
			return undefined;
		}
		const url: string | null | undefined = ( gitHubComponent as any )?.getRepository( file )?.getGitHubURL( file );
		if( !url ){
			return undefined;
		}
		if( !codeSample ){
			return url;
		}
		return `${url}#L${codeSample.startLine}-L${codeSample.endLine}`;
	}
}
