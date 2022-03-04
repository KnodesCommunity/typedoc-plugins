import assert from 'assert';
import { relative } from 'path';

import { escapeRegExp, isString, once } from 'lodash';
import { Application, JSX, LogLevel, PageEvent, Reflection } from 'typedoc';

import { ABasePlugin, CurrentPageMemo, EventsExtra, MarkdownReplacer, PathReflectionResolver } from '@knodes/typedoc-pluginutils';

import { getCodeBlockRenderer } from './code-blocks';
import { DEFAULT_BLOCK_NAME, ICodeSample, readCodeSample } from './code-sample-file';
import { buildOptions } from './options';
import { CodeBlockReflection } from './reflections';
import { EBlockMode } from './types';

const EXTRACT_CODE_BLOCKS_REGEX = /\{\\?@codeblock\s+(\S+?\w+?)(?:#(.+?))?(?:\s+(\w+))?(?:\s*\|\s*(.*?))?\s*\}/g;
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
		this._markdownReplacer.bindReplace( EXTRACT_CODE_BLOCKS_REGEX, this._replaceCodeBlock.bind( this ), '{@codeblock}' );
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
	private _replaceInlineCodeBlock(
		{ captures, fullMatch }: Parameters<MarkdownReplacer.ReplaceCallback>[0],
		sourceHint: Parameters<MarkdownReplacer.ReplaceCallback>[1],
	): ReturnType<MarkdownReplacer.ReplaceCallback> {
		// Support escaped tags
		if( fullMatch.startsWith( '{\\@' ) ){
			this.logger.verbose( () => `Found an escaped tag "${fullMatch}" in "${sourceHint()}"` );
			return fullMatch.replace( '{\\@', '{@' );
		}
		// Extract informations
		const [ fileName, blockModeStr, blockIndent, markdownCodeSource ] = captures;
		const blockMode = blockModeStr ?
			EBlockMode[blockModeStr.toUpperCase() as keyof typeof EBlockMode] ?? assert.fail( `Invalid block mode "${blockModeStr}".` ) :
			this.pluginOptions.getValue().defaultBlockMode ?? EBlockMode.EXPANDED;
		assert.ok( fileName );
		assert.ok( markdownCodeSource );
		assert.ok( isString( blockIndent ) );
		const markdownCode = markdownCodeSource.replace( new RegExp( `^${escapeRegExp( blockIndent )}`, 'gm' ), '' );

		// Render
		const rendered = this._codeBlockRenderer().renderInlineCodeBlock( {
			fileName,
			markdownCode,
			mode: blockMode,
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
	private _replaceCodeBlock(
		{ captures, fullMatch }: Parameters<MarkdownReplacer.ReplaceCallback>[0],
		sourceHint: Parameters<MarkdownReplacer.ReplaceCallback>[1],
	): ReturnType<MarkdownReplacer.ReplaceCallback> {
		// Avoid recursion in code blocks
		if( this._currentPageMemo.currentReflection instanceof CodeBlockReflection ){
			return fullMatch;
		}
		// Support escaped tags
		if( fullMatch.startsWith( '{\\@' ) ){
			this.logger.verbose( () => `Found an escaped tag "${fullMatch}" in "${sourceHint()}"` );
			return fullMatch.replace( '{\\@', '{@' );
		}
		// Extract informations
		const [ file, block, blockModeStr, fakedFileName ] = captures;
		const blockMode = blockModeStr ?
			EBlockMode[blockModeStr.toUpperCase() as keyof typeof EBlockMode] ?? assert.fail( `Invalid block mode "${blockModeStr}".` ) :
			this.pluginOptions.getValue().defaultBlockMode ?? EBlockMode.EXPANDED;
		assert.ok( file );
		const defaultedBlock = block ?? DEFAULT_BLOCK_NAME; // TODO: Use ??= once on node>14
		const useWholeFile = defaultedBlock === DEFAULT_BLOCK_NAME;
		const resolvedFile = this._pathReflectionResolver.resolveNamedPath(
			this._currentPageMemo.currentReflection.project,
			file,
			{
				currentReflection: this._currentPageMemo.currentReflection,
				containerFolder: this.pluginOptions.getValue().source,
			} );
		if( !resolvedFile ){
			this.logger.error( () => `In "${sourceHint()}", could not resolve file "${file}" from ${this._currentPageMemo.currentReflection.name}` );
			return fullMatch;
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
		if( !codeSample ){
			throw new Error( `Missing block ${defaultedBlock} in ${resolvedFile}` );
		}

		// Render
		const headerFileName = fakedFileName ?? `./${relative( this.rootDir, resolvedFile )}${useWholeFile ? '' : `#${codeSample.startLine}~${codeSample.endLine}`}`;
		const url = this._resolveCodeSampleUrl( resolvedFile, useWholeFile ? null : codeSample );
		const fakePage = new PageEvent<Reflection>( codeSample.file );
		fakePage.model = new CodeBlockReflection( codeSample.region, codeSample.file, codeSample.code, codeSample.startLine, codeSample.endLine );
		return this._currentPageMemo.fakeWrapPage( fakePage, () => {
			const rendered = this._codeBlockRenderer().renderCodeBlock( {
				asFile: headerFileName,
				content: codeSample.code,
				mode: blockMode,
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
