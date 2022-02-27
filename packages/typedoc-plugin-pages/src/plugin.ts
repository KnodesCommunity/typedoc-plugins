import assert from 'assert';
import { dirname, join, relative, resolve } from 'path';

import { isNumber, isString, once } from 'lodash';
import { MergeExclusive } from 'type-fest';
import { Application, JSX, LogLevel, ParameterType, RendererEvent } from 'typedoc';

import { ABasePlugin, CurrentPageMemo, MarkdownReplacer } from '@knodes/typedoc-pluginutils';

import { IPluginOptions, readPluginOptions } from './options';
import { getPageTreeBuilder } from './page-tree';
import { NodeReflection } from './reflections';
import { FallbackDefaultThemeSearch } from './search';

const EXTRACT_PAGE_LINK_REGEX = /{\\?@page\s+([^}\s]+)(?:\s+([^}]+?))?\s*}/g;
export class PagesPlugin extends ABasePlugin {
	public readonly pageTreeBuilder = once( () => getPageTreeBuilder( this.application, this ) );
	private readonly _pluginOptions = this.addOption<MergeExclusive<IPluginOptions, {logLevel: LogLevel}>>( {
		name: '__',
		help: 'Configuration or the path to the pages configuration file.',
		type: ParameterType.Mixed,
		mapper: readPluginOptions,
	} );
	private readonly _currentPageMemo = new CurrentPageMemo( this );
	public constructor( application: Application ){
		super( application, __filename );
	}

	/**
	 * This method is called after the plugin has been instanciated.
	 */
	public override initialize(){
		const opts = this._pluginOptions.getValue();
		if( 'logLevel' in opts && isNumber( opts.logLevel ) ) {
			this.logger.level = opts.logLevel;
		}
		this.application.renderer.on( RendererEvent.BEGIN, this.addPagesToProject.bind( this ) );
		const markdownReplacer = new MarkdownReplacer( this );
		markdownReplacer.bindReplace( EXTRACT_PAGE_LINK_REGEX, this._replacePageLink.bind( this ) );
		new FallbackDefaultThemeSearch( this ).initialize();
	}

	/**
	 * Generate pages mappings & append {@link NodeReflection} to the project.
	 *
	 * @param event - The renderer event emitted at {@link RendererEvent.BEGIN}.
	 */
	public addPagesToProject( event: RendererEvent ){
		const opts = this._pluginOptions.getValue();
		this.pageTreeBuilder().appendToProject( event, opts );
		this.application.logger.info( `Generating ${this.pageTreeBuilder().mappings.length} pages` );
	}

	/**
	 * Resolve the path to the given {@link targetPage}, emitted from the {@link currentSource} page.
	 *
	 * @param currentSource - The file containing the link.
	 * @param targetPage - The page targetted.
	 * @returns the resolved file.
	 */
	private _resolveSourceFilePath( currentSource: string, targetPage: string ){
		if( targetPage.startsWith( '~~/' ) ){
			const { source: sourceDir } = this._pluginOptions.getValue();
			targetPage = targetPage.replace( /^~~\//, '' );
			return sourceDir ? join( sourceDir, targetPage ) : targetPage;
		}
		return relative(
			this.rootDir,
			resolve( dirname( currentSource ), targetPage ),
		);
	}

	/**
	 * Transform the parsed text of the given {@link event MarkdownEvent} to replace page links.
	 *
	 * @param capture - The captured infos.
	 * @param sourceHint - The best guess to the source of the match,
	 * @returns the replaced content.
	 */
	private _replacePageLink(
		{ captures, fullMatch }: Parameters<MarkdownReplacer.ReplaceCallback>[0],
		sourceHint: Parameters<MarkdownReplacer.ReplaceCallback>[1],
	): ReturnType<MarkdownReplacer.ReplaceCallback> {
		if( fullMatch.startsWith( '{\\@' ) ){
			this.logger.verbose( () => `Found an escaped tag "${fullMatch}" in "${sourceHint()}"` );
			return fullMatch.replace( '{\\@', '{@' );
		}
		const [ page, label ] = captures;
		assert( isString( page ) );
		const currentSource = this._currentPageMemo.currentReflection.sources?.[0]?.fileName;
		if( !currentSource ){
			this.logger.error( `Could not get a source for the current file ${this._currentPageMemo.currentReflection.name}` );
			return fullMatch;
		}
		const resolvedFile = this._resolveSourceFilePath( currentSource, page );
		const builder = this.pageTreeBuilder();
		const { mappings } = builder;
		const mapping = mappings.find( m => relative( this.rootDir, m.model.sourceFilePath ) === resolvedFile );
		if( !mapping ){
			this.logger.error( () => `In "${sourceHint()}", could not find a page for "${page}" (resolved as "${resolvedFile}"). Known pages are ${JSON.stringify( mappings
				.map( m => relative( process.cwd(), m.model.sourceFilePath ) ) )}` );
			return fullMatch;
		} else {
			this.logger.verbose( () => `Created a link from "${sourceHint()}" to "${mapping.model.name}" (resolved as "${resolvedFile}")` );
		}
		const link = builder.renderPageLink( { label: label ?? undefined, mapping } );
		if( typeof link === 'string' ){
			return link;
		} else {
			return JSX.renderElement( link );
		}
	}
}
( {} as any as NodeReflection );
