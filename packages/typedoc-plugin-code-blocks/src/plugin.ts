import assert from 'assert';
import { existsSync, statSync } from 'fs';
import { dirname, relative, resolve } from 'path';

import { isNil, isPlainObject, isString, once } from 'lodash';
import pkgUp from 'pkg-up';
import { PackageJson } from 'type-fest';

import { Application, Context, Converter, JSX, MarkdownEvent, ParameterType, Reflection, ReflectionKind, RendererEvent } from 'typedoc';

import { ABasePlugin } from '@knodes/typedoc-pluginutils';

import { getCodeBlockRenderer } from './code-blocks';
import { DEFAULT_BLOCK_NAME, ICodeSample, readCodeSample } from './code-sample-file';
import { FoldableMode } from './theme';

const EXTRACT_CODE_BLOCKS_REGEX = /\{@codeblock\s+(?:(foldable|folded)\s+)?(.+?)(?:#(.+?))?(?:\s*\|\s*(.*?))?\}/;

type CodeBlockDirs = {'~~': string} & Record<string, string | undefined>
/**
 * Pages plugin for integrating your own pages into documentation output
 */
export class CodeBlockPlugin extends ABasePlugin {
	private readonly _directoriesOption = this.addOption<CodeBlockDirs>( {
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
			if( '~~' in obj ){
				throw new Error( 'Can\'t explicitly set `~~` directory' );
			}
			const pairs = Object.entries( obj );
			for( const [ key, value ] of pairs ){
				if( !key.match( /^\w+$/ ) ){
					throw new Error( 'Should have alphanumeric-only keys' );
				}
				if( typeof value !== 'string' ){
					throw new Error( 'Should have only path values' );
				}
				const resolved = relative( process.cwd(), resolve( this._rootDir, value ) );
				if( !existsSync( resolved ) ){
					throw new Error( `Code block alias "${key}" (resolved to ${resolved}) does not exist.` );
				}
				obj[key] = resolved;
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
	private readonly _getCodeBlockRenderer = once( () => getCodeBlockRenderer( this.application, this ) );

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
		this.application.renderer.on( MarkdownEvent.PARSE, this._processMarkdown.bind( this ) );
		// Hook on reflections resolution start. At this point, the project contains all modules in case of a `project` {@link import('typedoc').EntryPointStrategy EntryPointStrategy}.
		this.application.converter.on( Converter.EVENT_RESOLVE_BEGIN, ( _ctx: Context ) => {
			const directories = this._directoriesOption.getValue();
			_ctx.project.getChildrenByKind( ReflectionKind.Module ).forEach( r => {
				const packageJsonFile = this._findReflectionPackageJson( r );
				if( !packageJsonFile ){
					return;
				}
				this.logger.makeChildLogger( r.name ).verbose( `package.json file found at "${packageJsonFile}"` );
				directories[r.name] = dirname( packageJsonFile );
			} );
		} );
		// Store all reflections so that code blocks can be replaced once the theme is defined.
		const onRenderBegin: Array<() => void> = [];
		this.application.converter.on( Converter.EVENT_RESOLVE, ( _ctx: Context, reflection: Reflection ) => {
			onRenderBegin.push( () => {
				if( reflection.comment ){
					reflection.comment.shortText = this.replaceCodeBlocks( reflection.comment.shortText, reflection );
					reflection.comment.text = this.replaceCodeBlocks( reflection.comment.text, reflection );
					if( reflection.comment.returns ){
						reflection.comment.returns = this.replaceCodeBlocks( reflection.comment.returns, reflection );
					}
				}
			} );
		} );
		this.application.renderer.on( RendererEvent.BEGIN, () => onRenderBegin.forEach( r => r() ) );
	}

	/**
	 * Replace code blocks in the given source.
	 *
	 * @param sourceMd - The markdown text to replace.
	 * @param reflection - The reflection currently being replaced.
	 * @returns the replaced markdown.
	 */
	public replaceCodeBlocks( sourceMd: string, reflection?: Reflection ): string {
		const regex = new RegExp( EXTRACT_CODE_BLOCKS_REGEX.toString().slice( 1, -1 ), 'g' );
		return sourceMd.replace(
			regex,
			fullmatch => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Re-run the exact same regex.
				const [ , foldable, file, block, fakedFileName ] = fullmatch.match( EXTRACT_CODE_BLOCKS_REGEX )!;
				if( foldable !== 'foldable' && foldable !== 'folded' && foldable ){
					throw new Error( `Invalid foldable state "${foldable}". Expected "foldable" | "folded"` );
				}
				this.logger.makeChildLogger( reflection?.sources?.[0].fileName ?? 'UNKNOWN SOURCE' ).verbose( [
					'Generating',
					foldable,
					`code block to ${file}`,
					block ? `(block "${block}")` : null,
					fakedFileName ? `as "${fakedFileName}"` : null,
				].filter( isString ).join( ' ' ) );
				return this._generateCodeBlock( file, block, fakedFileName, ( foldable || null ) as FoldableMode );
			} );
	}

	/**
	 * Look up the `package.json` file corresponding to the given {@link reflection}.
	 *
	 * @param reflection - The reflection to use as a base for the search.
	 * @returns the `package.json` path, or `undefined` if reflection don't have a source (should never happen).
	 */
	private _findReflectionPackageJson( reflection: Reflection ){
		if( !reflection.sources || reflection.sources.length === 0 ){
			return;
		}
		let source = reflection.sources[0].fileName;
		let i = 0;
		do {
			const packageJsonPath = pkgUp.sync( { cwd: source } );
			assert( packageJsonPath );
			// eslint-disable-next-line @typescript-eslint/no-var-requires -- require package.json
			const packageContent = require( packageJsonPath ) as PackageJson;
			if( packageContent.name === reflection.name ){
				return relative( this._rootDir, packageJsonPath );
			}
			this.logger.makeChildLogger( reflection.name ).verbose( `Skipping package.json file "${packageJsonPath}", as its name "${packageContent.name}" does not match the searched name` );
			source = packageJsonPath;
		} while( i++ < 5 );
		throw new Error( `Could not look up the package.json file of ${reflection.sources[0].fileName}` );
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
		const codeBlockDirs = this._directoriesOption.getValue();
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
	private _resolveCodeSampleUrl( file: string, codeSample: ICodeSample | null ): string | undefined {
		const gitHubComponent = this.application.converter.getComponent( 'git-hub' );
		if( !gitHubComponent ){
			return undefined;
		}
		const repository = ( gitHubComponent as any ).getRepository( file );
		const url: string | null | undefined = repository.getGitHubURL( file );
		if( !url ){
			return undefined;
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
	private _generateCodeBlock( file: string, region: string | null, fakedFileName: string | null, foldable: FoldableMode ){
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
		const rendered = this._getCodeBlockRenderer().renderCodeBlock( {
			asFile: headerFileName,
			content: codeSample.code,
			mode: foldable,
			sourceFile: resolvedFile,
			url,
		} );
		if( typeof rendered === 'string' ){
			return rendered;
		} else {
			return JSX.renderElement( rendered );
		}
	}
}
