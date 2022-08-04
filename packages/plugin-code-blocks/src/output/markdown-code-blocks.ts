import assert from 'assert';
import { relative } from 'path';

import { isString, uniq } from 'lodash';
import { filter as filterGlob } from 'minimatch';
import { DeclarationReflection, ReflectionKind, RepositoryType, normalizePath } from 'typedoc';

import { CurrentPageMemo, IPluginComponent, MarkdownReplacer, reflectionKindUtils, reflectionSourceUtils, resolveNamedPath } from '@knodes/typedoc-pluginutils';

import { DEFAULT_BLOCK_NAME, ICodeSample, readCodeSample } from '../code-sample-file';
import type { CodeBlockPlugin } from '../plugin';
import { EBlockMode } from '../types';
import { ICodeBlocksPluginThemeMethods } from './theme';

// eslint-disable-next-line @typescript-eslint/no-var-requires -- Get name from package
const { name } = require( '../../package.json' );

const comments = Object.entries( {
	'.?([cm])[tj]s?(x)': '// ...',
} ).map( ( [ k, v ] ) => {
	const filter = filterGlob( `**/*${k}` );
	return { check: ( file: string ) => filter( file, 1, [ file ] ), comment: v };
} );
const getFirstLineIndent = ( lines?: string[] ) => ( lines?.filter( l => l.trim() )[0]?.match( /^\s*/ ) ?? [ '' ] )[0];
const CODEBLOCK_KIND = reflectionKindUtils.addReflectionKind( name, 'CodeBlock' ) as ReflectionKind;
const EXTRACT_CODE_BLOCKS_REGEX = /(\S+?\w+?)(?:#(.+?))?(?:\s+(\w+))?(?:\s*\|\s*(.*?))?\s*/;
const EXTRACT_INLINE_CODE_BLOCKS_REGEX = /(\S+?)(?:\s+(\w+))?\s*(```(\w+)?.*?```)/s;
export class MarkdownCodeBlocks implements IPluginComponent<CodeBlockPlugin>{
	private readonly _logger = this.plugin.logger.makeChildLogger( MarkdownCodeBlocks.name );
	private readonly _currentPageMemo = CurrentPageMemo.for( this );
	private readonly _markdownReplacer = new MarkdownReplacer( this );
	private readonly _fileSamples = new Map<string, Map<string, ICodeSample>>();
	public constructor( public readonly plugin: CodeBlockPlugin, private readonly _themeMethods: ICodeBlocksPluginThemeMethods ){
		const opts = { excludedMatches: this.plugin.pluginOptions.getValue().excludeMarkdownTags };
		this._markdownReplacer.registerMarkdownTag( '@codeblock', EXTRACT_CODE_BLOCKS_REGEX, this._replaceCodeBlock.bind( this ), opts );
		this._markdownReplacer.registerMarkdownTag( '@inlineCodeblock', EXTRACT_INLINE_CODE_BLOCKS_REGEX, this._replaceInlineCodeBlock.bind( this ), opts );
		this._currentPageMemo.initialize();
	}

	/**
	 * Transform the parsed inline code block.
	 *
	 * @param match - The match infos.
	 * @returns the replaced content.
	 */
	private _replaceInlineCodeBlock( match: MarkdownReplacer.Match ) {
		// Avoid recursion in code blocks
		if( this._currentPageMemo.currentReflection instanceof DeclarationReflection && this._currentPageMemo.currentReflection.kind === CODEBLOCK_KIND ){
			return;
		}
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
		// Avoid recursion in code blocks
		if( this._currentPageMemo.currentReflection instanceof DeclarationReflection && this._currentPageMemo.currentReflection.kind === CODEBLOCK_KIND ){
			return;
		}
		const [ file, block, blockModeStr, fakedFileName ] = match.captures;
		try {
			const { resolvedFile, fileSample } = this._resolveCodeBlock( file );
			const codeSamples = this._extractBlockFromFileSample( fileSample, block );
			this._logger.verbose( () => `Created a code block to ${this.plugin.relativeToRoot( resolvedFile )} from ${sourceHint()}` );
			const lineRange = codeSamples.some( c => c.region === DEFAULT_BLOCK_NAME ) ?
				null :
				[ Math.min( ...codeSamples.map( c => c.startLine ) ), Math.max( ...codeSamples.map( c => c.endLine ) ) ] as const;
			const headerFileName = fakedFileName ?? this._getHeaderFileName( resolvedFile, lineRange );
			const url = this._resolveCodeSampleUrl( resolvedFile, lineRange );
			const fakeReflection = new DeclarationReflection( `${file}#${lineRange ? `#${lineRange[0]}~${lineRange[1]}` : ''}`, CODEBLOCK_KIND, this._currentPageMemo.currentReflection );
			fakeReflection.sources = [ reflectionSourceUtils.createSourceReference( this, resolvedFile, lineRange?.[0] ) ];
			return this._currentPageMemo.fakeWrapPage( fakeReflection, () => this._themeMethods.renderCodeBlock( {
				asFile: headerFileName,
				content: this._assembleCodeSamples( codeSamples, resolvedFile ),
				mode: this._getBlockMode( blockModeStr ),
				sourceFile: resolvedFile,
				url,
			} ) );
		} catch( err: any ) {
			this._logger.error( () => `In ${sourceHint()}: Failed to render code block from ${this._currentPageMemo.currentReflection.name}: ${err?.message ?? err}` );
			return undefined;
		}
	}

	/**
	 * Get the sample file for the given file
	 *
	 * @param file - The file to get the block from.
	 * @returns the file sample.
	 */
	private _resolveCodeBlock( file: string | null ){
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
		return { fileSample, resolvedFile };
	}

	/**
	 * Extract code samples from a file sample.
	 *
	 * @param fileSample - The file sample to use.
	 * @param blockStr - The optional block name.
	 * @returns a list of matched code samples.
	 */
	private _extractBlockFromFileSample( fileSample: Map<string, ICodeSample>, blockStr: string | null ){
		const defaultedBlock = blockStr ?? DEFAULT_BLOCK_NAME;
		const fileSampleKeys = [ ...fileSample.keys() ];
		const parts = uniq( defaultedBlock.split( /\+/ ).flatMap( pattern => {
			const matched = fileSampleKeys.filter( filterGlob( pattern ) );
			if( matched.length === 0 ){
				this._logger.warn( `Pattern "${pattern}" did not matched any code block` );
			}
			return matched;
		} ) );
		const samples = parts.map( p => {
			const block = fileSample.get( p );
			assert( block, `Missing block ${p}` );
			return block;
		} );
		assert( samples.length > 0, `Missing block ${defaultedBlock}` );
		return samples;
	}

	/**
	 * Merge code sample files
	 *
	 * @param samples - A list of code samples to merge.
	 * @param sourceFile - The source file name.
	 * @returns the merged code.
	 */
	private _assembleCodeSamples( samples: ICodeSample[], sourceFile: string ) {
		const comment = comments.find( c => c.check( sourceFile ) )?.comment ?? '...';
		return samples.flatMap( ( s, i ) => {
			const current = s.code;
			const currentLastLineIndent = getFirstLineIndent( current.split( '\n' ).reverse() );
			const next = samples[i + 1]?.code;
			const nextFirstLineIndent = getFirstLineIndent( next?.split( '\n' ) );
			const maxIndent = currentLastLineIndent.startsWith( nextFirstLineIndent ) ? currentLastLineIndent :
				nextFirstLineIndent.startsWith( currentLastLineIndent ) ? nextFirstLineIndent :
				( () => {
					this._logger.warn( `Inconsistent indentation in ${sourceFile}` );
					return nextFirstLineIndent;
				} )();
			return [ current, maxIndent + comment ];
		} ).slice( 0, -1 ).join( '\n' );
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
	 * @param lineRange - The lines range.
	 * @returns the file name to show in the header.
	 */
	private _getHeaderFileName( file: string, lineRange: readonly [number, number] | null ): string {
		const filePath = normalizePath( relative( this.plugin.rootDir, file ) );
		const regionMarker = lineRange ? `#${lineRange[0]}~${lineRange[1]}` : '';
		return `./${filePath}${regionMarker}`;
	}

	/**
	 * Try to get the URL to the given {@link file}, optionally ranging the {@link codeSample}.
	 *
	 * @param file - The file to resolve.
	 * @param lineRange - The lines range.
	 * @returns the URL, or `null`.
	 */
	private _resolveCodeSampleUrl( file: string, lineRange: readonly [number, number] | null ): string | undefined {
		const sourceComponent = this.plugin.application.converter.getComponent( 'source' );
		if( !sourceComponent ){
			return undefined;
		}
		const repository = ( sourceComponent as any )?.getRepository( file );
		if( !repository ){
			return;
		}
		const url: string | null | undefined = repository?.getURL( file );
		if( !url ){
			return undefined;
		}
		if( !lineRange ){
			return url;
		}
		const anchor = ( {
			[RepositoryType.GitHub]: `L${lineRange[0]}-L${lineRange[1]}`,
			[RepositoryType.GitLab]: `L${lineRange[0]}-L${lineRange[1]}`,
		} as Record<RepositoryType, string | undefined> )[repository.type as RepositoryType];
		if( anchor ){
			return `${url}#${anchor}`;
		}
		return url;
	}
}
export const bindMarkdownCodeBlocks = ( plugin: CodeBlockPlugin, themeMethods: ICodeBlocksPluginThemeMethods ) => new MarkdownCodeBlocks( plugin, themeMethods );
