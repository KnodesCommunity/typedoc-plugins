import assert from 'assert';
import { relative } from 'path';

import { isString } from 'lodash';
import { normalizePath } from 'typedoc';

import { CurrentPageMemo, IPluginComponent, MarkdownReplacer, resolveNamedPath } from '@knodes/typedoc-pluginutils';

import { DEFAULT_BLOCK_NAME, ICodeSample, readCodeSample } from '../code-sample-file';
import type { CodeBlockPlugin } from '../plugin';
import { EBlockMode } from '../types';
import { ICodeBlocksPluginThemeMethods } from './theme';

const EXTRACT_CODE_BLOCKS_REGEX = /(\S+?\w+?)(?:#(.+?))?(?:\s+(\w+))?(?:\s*\|\s*(.*?))?\s*/;
const EXTRACT_INLINE_CODE_BLOCKS_REGEX = /(\S+?)(?:\s+(\w+))?\s*(```(\w+)?.*?```)/s;
export class MarkdownCodeBlocks implements IPluginComponent<CodeBlockPlugin>{
	private readonly _logger = this.plugin.logger.makeChildLogger( MarkdownCodeBlocks.name );
	private readonly _currentPageMemo = CurrentPageMemo.for( this );
	private readonly _markdownReplacer = new MarkdownReplacer( this );
	private readonly _fileSamples = new Map<string, Map<string, ICodeSample>>();
	public constructor( public readonly plugin: CodeBlockPlugin, private readonly _themeMethods: ICodeBlocksPluginThemeMethods ){
		this._markdownReplacer.registerMarkdownTag( '@codeblock', EXTRACT_CODE_BLOCKS_REGEX, this._replaceCodeBlock.bind( this ) );
		this._markdownReplacer.registerMarkdownTag( '@inlineCodeblock', EXTRACT_INLINE_CODE_BLOCKS_REGEX, this._replaceInlineCodeBlock.bind( this ) );
		this._currentPageMemo.initialize();
	}

	/**
	 * Transform the parsed inline code block.
	 *
	 * @param match - The match infos.
	 * @returns the replaced content.
	 */
	private _replaceInlineCodeBlock( match: MarkdownReplacer.Match ) {
		const [ fileName, blockModeStr, markdownCode ] = match.captures;
		assert.ok( fileName );
		assert.ok( markdownCode );

		// Render
		return this._themeMethods.renderInlineCodeBlock( {
			fileName,
			markdownCode,
			mode: this._getBlockMode( blockModeStr ),
		} );
	}

	/**
	 * Transform the parsed code block.
	 *
	 * @param match - The match infos.
	 * @param sourceHint - The best guess to the source of the match,
	 * @returns the replaced content.
	 */
	private _replaceCodeBlock( match: MarkdownReplacer.Match, sourceHint: MarkdownReplacer.SourceHint ) {
		const [ file, block, blockModeStr, fakedFileName ] = match.captures;
		try {
			const resolved = this._resolveCodeBlock( file, block );
			this._logger.verbose( () => `Created a code block to ${this.plugin.relativeToRoot( resolved.file )} from ${sourceHint()}` );
			const headerFileName = fakedFileName ?? this._getHeaderFileName( resolved.file, resolved.codeSample );
			const url = this._resolveCodeSampleUrl( resolved.file, resolved.codeSample.region === DEFAULT_BLOCK_NAME ? null : resolved.codeSample );
			return this._themeMethods.renderCodeBlock( {
				asFile: headerFileName,
				content: resolved.codeSample.code,
				mode: this._getBlockMode( blockModeStr ),
				sourceFile: resolved.file,
				url,
			} );
		} catch( err ) {
			this._logger.error( () => `In "${sourceHint()}", failed to render code block from ${this._currentPageMemo.currentReflection.name}: ${err}` );
			return undefined;
		}
	}

	/**
	 * Get the code sample for the given file & block.
	 *
	 * @param file - The file to get the block from.
	 * @param block - The optional block name.
	 * @returns the code sample.
	 */
	private _resolveCodeBlock( file: string | null, block: string | null ){
		assert( isString( file ) );
		const resolvedFile = resolveNamedPath(
			this._currentPageMemo.currentReflection,
			this.plugin.pluginOptions.getValue().source,
			file );
		if( !resolvedFile ){
			throw new Error( `Could not resolve file ${file}` );
		}
		// Get the actual code sample
		if( !this._fileSamples.has( resolvedFile ) ){
			this._fileSamples.set( resolvedFile, readCodeSample( resolvedFile ) );
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Set above
		const fileSample = this._fileSamples.get( resolvedFile )!;
		const defaultedBlock = block ?? DEFAULT_BLOCK_NAME;
		const codeSample = fileSample?.get( defaultedBlock );
		assert( codeSample, `Missing block ${defaultedBlock} in ${resolvedFile}` );
		return { codeSample, file: resolvedFile };
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
			this.plugin.pluginOptions.getValue().defaultBlockMode ?? EBlockMode.EXPANDED;
	}

	/**
	 * Generate the code block header file name.
	 *
	 * @param file - The path to the code sample file.
	 * @param codeSample - The code sample infos.
	 * @returns the file name to show in the header.
	 */
	private _getHeaderFileName( file: string, codeSample: ICodeSample ): string {
		const filePath = normalizePath( relative( this.plugin.rootDir, file ) );
		const regionMarker = codeSample.region === DEFAULT_BLOCK_NAME ? '' : `#${codeSample.startLine}~${codeSample.endLine}`;
		return `./${filePath}${regionMarker}`;
	}

	/**
	 * Try to get the URL to the given {@link file}, optionally ranging the {@link codeSample}.
	 *
	 * @param file - The file to resolve.
	 * @param codeSample - The code sample containing the lines range to select.
	 * @returns the URL, or `null`.
	 */
	private _resolveCodeSampleUrl( file: string, codeSample: ICodeSample | null ): string | undefined {
		const sourceComponent = this.plugin.application.converter.getComponent( 'source' );
		if( !sourceComponent ){
			return undefined;
		}
		const url: string | null | undefined = ( sourceComponent as any )?.getRepository( file )?.getURL( file );
		if( !url ){
			return undefined;
		}
		if( !codeSample ){
			return url;
		}
		return `${url}#L${codeSample.startLine}-L${codeSample.endLine}`;
	}
}
export const bindMarkdownCodeBlocks = ( plugin: CodeBlockPlugin, themeMethods: ICodeBlocksPluginThemeMethods ) => new MarkdownCodeBlocks( plugin, themeMethods );
