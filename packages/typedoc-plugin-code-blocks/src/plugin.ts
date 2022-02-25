import { existsSync, readFileSync, statSync } from 'fs';
import { dirname, extname, relative, resolve } from 'path';

import { isNil, isPlainObject, isString } from 'lodash';
import { Renderer, marked } from 'marked';
import { Application, Context, Converter, MarkdownEvent, ParameterType, Reflection } from 'typedoc';

import { ABasePlugin } from '@knodes/typedoc-pluginutils';

import { DEFAULT_BLOCK_NAME, ICodeSample, readCodeSample } from './code-sample-file';

const EXTRACT_CODE_BLOCKS_REGEX = /\{@codeblock\s+(?:(foldable|folded)\s+)?(.+?)(?:#(.+?))?(?:\s*\|\s*(.*?))?\}/;

export type Foldable = 'foldable' | 'folded' | undefined;

type CodeBlockDirs = {'~~': string} & Record<string, string | undefined>
/**
 * Pages plugin for integrating your own pages into documentation output
 */
export class CodeBlockPlugin extends ABasePlugin {
	public readonly directoriesOption = this.addOption<CodeBlockDirs>( {
		name: 'directories',
		help: `A map of base directories where to extract code blocks. Some well-known fields are always set:
* \`~~\` is the directory containing the TypeDoc config.
* In \`project\` \`entryPointStrategy\`, packages by name.`,
		type: ParameterType.Mixed,
		mapper: ( raw: unknown ) => {
			let obj: Partial<CodeBlockDirs>;
			if( isNil( raw ) ){
				obj = {};
			} else if( isPlainObject( raw ) ){
				obj = raw as any;
			} else {
				throw new TypeError( 'Invalid option value type' );
			}
			const pairs = Object.entries( obj );
			for( const [ key, value ] of pairs ){
				if( !key.match( /^\w+$/ ) ){
					throw new Error( 'Should have alphanumeric-only keys' );
				}
				if( typeof value !== 'string' ){
					throw new Error( 'Should have only path values' );
				}
				const resolved = resolve( value );
				if( !existsSync( resolved ) ){
					throw new Error( `Code block alias "${key}" (resolved to ${resolved}) does not exist.` );
				}
				obj[key] = resolved;
			}
			if( '~~' in obj ){
				throw new Error( 'Can\'t explicitly set `~~` directory' );
			}
			obj['~~'] = this._rootDir;
			return obj as CodeBlockDirs;
		},
	} );
	private readonly _fileSamples = new Map<string, Map<string, ICodeSample>>();

	private _rootDirCache?: string;
	private get _rootDir(): string {
		if( !this._rootDirCache ) {
			const opts = this.application.options.getValue( 'options' );
			const stat = statSync( opts );
			if( stat.isDirectory() ){
				this._rootDirCache = opts;
			} else if( stat.isFile() ){
				this._rootDirCache = dirname( opts );
			} else {
				throw new Error();
			}
		}
		return this._rootDirCache;
	}
	private _currentReflection?: Reflection;

	public constructor( application: Application ){
		super( application, __filename );
	}

	/**
	 *
	 */
	public initialize(): void {
		this.application.renderer.on( MarkdownEvent.PARSE, this._processMarkdown.bind( this ) );
		this.application.converter.on( Converter.EVENT_RESOLVE, ( _ctx: Context, reflection: Reflection ) => {
			this._currentReflection = reflection;
			if( reflection.comment ){
				reflection.comment.shortText = this.replaceCodeBlocks( reflection.comment.shortText );
				reflection.comment.text = this.replaceCodeBlocks( reflection.comment.text );
				if( reflection.comment.returns ){
					reflection.comment.returns = this.replaceCodeBlocks( reflection.comment.returns );
				}
			}
		} );
	}

	/**
	 * Replace code blocks in the given source.
	 *
	 * @param sourceMd - The markdown text to replace.
	 * @returns the replaced markdown.
	 */
	public replaceCodeBlocks( sourceMd: string ): string {
		const regex = new RegExp( EXTRACT_CODE_BLOCKS_REGEX.toString().slice( 1, -1 ), 'g' );
		const replaced = sourceMd.replace(
			regex,
			fullmatch => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Re-run the exact same regex.
				const [ , foldable, file, block, fakedFileName ] = fullmatch.match( EXTRACT_CODE_BLOCKS_REGEX )!;
				if( foldable !== 'foldable' && foldable !== 'folded' && foldable ){
					throw new Error( `Invalid foldable state "${foldable}". Expected "foldable" | "folded"` );
				}
				this.logger.makeChildLogger( this._currentReflection?.sources?.[0].fileName ?? 'UNKNOWN SOURCE' ).verbose( [
					'Generating',
					foldable,
					`code block to ${file}`,
					block ? `(block "${block}")` : null,
					fakedFileName ? `as "${fakedFileName}"` : null,
				].filter( isString ).join( ' ' ) );
				return this._generateCodeBlock( file, block, fakedFileName, ( foldable || undefined ) as Foldable );
			} );
		if( replaced !== sourceMd ){
			return `<style>${readFileSync( resolve( __dirname, '../static/code-block.css' ) )}</style>\n\n${replaced}`;
		}
		return sourceMd;
	}

	/**
	 * Transform the parsed text of the given {@link event MarkdownEvent} to replace code blocks.
	 *
	 * @param event - The event to modify.
	 */
	private _processMarkdown( event: MarkdownEvent ) {
		const originalText = event.parsedText;
		event.parsedText = this.replaceCodeBlocks( originalText );
	}

	/**
	 * Get the absolute path of the give {@link file} in its named directory.
	 *
	 * @param file - The file to resolve.
	 * @returns the file resolved path.
	 */
	private _resolveFile( file: string ){
		const [ dir, ...path ] = file.split( '/' );
		const codeBlockDirs = this.directoriesOption.getValue();
		const codeBlockDir = codeBlockDirs[dir];
		if( !codeBlockDir ){
			throw new Error( `Trying to use code block from named directory ${dir} (targetting file ${file}), but it is not defined.` );
		}

		const newPath = resolve( codeBlockDir, ...path );
		return newPath;
	}

	/**
	 * Try to get the URL to the given {@link file}, optionally ranging the {@link codeSample}.
	 *
	 * @param file - The file to resolve.
	 * @param codeSample - The code sample containing the lines range to select.
	 * @returns the URL, or `null`.
	 */
	private _resolveCodeSampleUrl( file: string, codeSample: ICodeSample | null ){
		const gitHubComponent = this.application.converter.getComponent( 'git-hub' );
		if( !gitHubComponent ){
			return null;
		}
		const repository = ( gitHubComponent as any ).getRepository( file );
		const url = repository.getGitHubURL( file );
		if( !url ){
			return null;
		}
		if( !codeSample ){
			return url;
		}
		return `${url}#L${codeSample.startLine}-L${codeSample.endLine}`;
	}

	/**
	 * Generate the code block associated with the given {@link region} in the specified {@link file}.
	 *
	 * @param file - The name of the file (1st path segment is the named directory defined in options).
	 * @param region - The name of the region to use, or `null`.
	 * @param fakedFileName - The explicit file name to print.
	 * @param foldable - The foldable type of the code block.
	 * @returns the full code block.
	 */
	private _generateCodeBlock( file: string, region: string | null, fakedFileName: string | null, foldable: Foldable ){
		// Use ??= once on node>14
		region = region ?? DEFAULT_BLOCK_NAME;
		const useWholeFile = region === DEFAULT_BLOCK_NAME;
		const resolvedFile = this._resolveFile( file );
		if( !this._fileSamples.has( resolvedFile ) ){
			this._fileSamples.set( resolvedFile, readCodeSample( resolvedFile ) );
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Set above
		const fileSample = this._fileSamples.get( resolvedFile )!;
		const codeSample = fileSample?.get( region );
		if( !codeSample ){
			throw new Error( `Missing block ${region} in ${resolvedFile}` );
		}

		const headerFileName = fakedFileName ?? `./${relative( this._rootDir, resolvedFile )}${useWholeFile ? '' : `#${codeSample.startLine}~${codeSample.endLine}`}`;
		const url = this._resolveCodeSampleUrl( resolvedFile, useWholeFile ? null : codeSample );
		const header = marked( `From ${url ? `[${headerFileName}](${url})` : `${headerFileName}`}` );

		const codeHighlighted = new Renderer().code( codeSample.code, extname( resolvedFile ).slice( 1 ), false );
		return this._wrapCodeBlock( header, codeHighlighted, foldable );
	}

	/**
	 * Wrap the given {@link code} into the correct HTML markup depending on the {@link foldable} type.
	 *
	 * @param header - The file header (name).
	 * @param code - The highlighted code to wrap.
	 * @param foldable - The foldable type.
	 * @returns the `code-block` element.
	 */
	private _wrapCodeBlock( header: string, code: string, foldable: Foldable ) {
		switch( foldable ){
			case undefined: {
				return `<div class="code-block">${header}${code}</div>`;
			}

			case 'foldable': {
				return `<details class="code-block" open="open"><summary>${header}</summary>${code}</details>`;
			}

			case 'folded': {
				return `<details class="code-block"><summary>${header}</summary>${code}</details>`;
			}

			default: {
				throw new Error( 'Invalid foldable marker' );
			}
		}
	}
}
