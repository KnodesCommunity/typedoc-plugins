import { existsSync, readFileSync } from 'fs';
import { extname, relative, resolve } from 'path';

import { Renderer, marked } from 'marked';
import { Application, MarkdownEvent, ParameterType } from 'typedoc';

import { DEFAULT_BLOCK_NAME, ICodeSample, readCodeSample } from './code-sample-file';
import { DIRECTORY } from './options';

const EXTRACT_CODE_BLOCKS_REGEX = /\{@codeblock\s+(?:(foldable|folded)\s+)?(.+?)(?:#(.+?))?(?:\s*\|\s*(.*?))?\}/;

export type Foldable = 'foldable' | 'folded' | undefined;

const isPojo = ( v: any ): v is Record<any, any> => v && typeof v === 'object' && Object.getPrototypeOf( v )?.constructor.name === 'Object';

/**
 * Pages plugin for integrating your own pages into documentation output
 */
export class CodeBlockPlugin {
	private readonly _fileSamples = new Map<string, Map<string, ICodeSample>>();
	private get _codeBlockDirs(): Record<string, string | undefined> {
		const dirs = this._application.options.getValue( DIRECTORY ) as any;
		if( !isPojo( dirs ) ){
			throw new Error( `Missing "${DIRECTORY}" option` );
		}
		return dirs;
	}
	private get _optionsDir(){
		return this._application.options.getValue( 'options' ) as string;
	}

	public constructor( private readonly _application: Application ){
		this._application.options.addDeclaration( {
			name: DIRECTORY,
			help: 'A map of base directories where to extract code blocks. Paths are resolved relative to the `options` file.',
			type: ParameterType.Mixed,
			validate: obj => {
				if( !isPojo( obj ) ){
					throw new Error( `Missing "${DIRECTORY}" option` );
				}
				const pairs = Object.entries( obj );
				for( const [ key, value ] of pairs ){
					if( !key.match( /^\w+$/ ) ){
						throw new Error( `"${DIRECTORY}" option should have alphanumeric-only keys` );
					}
					if( typeof value !== 'string' ){
						throw new Error( `"${DIRECTORY}" option should have only path values` );
					}
					const resolved = resolve( value );
					if( !existsSync( resolved ) ){
						throw new Error( `"${DIRECTORY}" code block alias "${key}" (resolved to ${resolved}) does not exist.` );
					}
					obj[key] = resolved;
				}
			},
		} );
	}

	/**
	 * Transform the parsed text of the given {@link event MarkdownEvent} to replace code blocks.
	 *
	 * @param event - The event to modify.
	 */
	public processMarkdown( event: MarkdownEvent ) {
		const originalText = event.parsedText;
		const regex = new RegExp( EXTRACT_CODE_BLOCKS_REGEX.toString().slice( 1, -1 ), 'g' );
		event.parsedText = originalText.replace(
			regex,
			fullmatch => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Re-run the exact same regex.
				const [ , foldable, file, block, fakedFileName ] = fullmatch.match( EXTRACT_CODE_BLOCKS_REGEX )!;
				if( foldable !== 'foldable' && foldable !== 'folded' && foldable ){
					throw new Error( `Invalid foldable state "${foldable}". Expected "foldable" | "folded"` );
				}
				return this._generateCodeBlock( file, block, fakedFileName, ( foldable || undefined ) as Foldable );
			} );
		if( event.parsedText !== originalText ){
			event.parsedText = `<style>${readFileSync( resolve( __dirname, '../static/code-block.css' ) )}</style>\n\n${event.parsedText}`;
		}
	}

	/**
	 * Get the absolute path of the give {@link file} in its named directory.
	 *
	 * @param file - The file to resolve.
	 * @returns the file resolved path.
	 */
	private _resolveFile( file: string ){
		const [ dir, ...path ] = file.split( '/' );
		const codeBlockDirs = this._codeBlockDirs;
		const codeBlockDir = codeBlockDirs[dir];
		if( !codeBlockDir ){
			throw new Error( `Trying to use code block from named directory ${dir} (targetting file ${file}), but it is not defined.` );
		}

		const newPath = resolve( this._optionsDir, codeBlockDir, ...path );
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
		const gitHubComponent = this._application.converter.getComponent( 'git-hub' );
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

		const headerFileName = fakedFileName ?? `./${relative( this._optionsDir, resolvedFile )}${useWholeFile ? '' : `#${codeSample.startLine}~${codeSample.endLine}`}`;
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
