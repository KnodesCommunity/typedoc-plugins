import assert from 'assert';

import { isString, once } from 'lodash';
import { Application, JSX, LogLevel, RendererEvent, UrlMapping } from 'typedoc';

import { ABasePlugin, CurrentPageMemo, EventsExtra, MarkdownReplacer, PathReflectionResolver } from '@knodes/typedoc-pluginutils';

import { buildOptions } from './options';
import { ANodeReflection, NodeReflection, PageReflection } from './reflections';
import { initThemePlugins } from './theme-plugins';

const EXTRACT_PAGE_LINK_REGEX = /(\S+?\w+?)(?:\s+([^}]+?))?\s*/g;
export class PagesPlugin extends ABasePlugin {
	public readonly pluginOptions = buildOptions( this );
	private readonly _pageTreeBuilder = once( () => initThemePlugins( this.application, this ) );
	private readonly _currentPageMemo = CurrentPageMemo.for( this );
	private readonly _markdownReplacer = new MarkdownReplacer( this );
	private readonly _pathReflectionResolver = new PathReflectionResolver( this );
	private _pagesTree?: ANodeReflection[];
	private _mappings?: Array<UrlMapping<PageReflection>>;
	public constructor( application: Application ){
		super( application, __filename );
	}

	/**
	 * This method is called after the plugin has been instanciated.
	 */
	public override initialize(){
		const opts = this.pluginOptions.getValue();
		this.logger.level = opts.logLevel;
		this._currentPageMemo.initialize();
		this.application.renderer.on( RendererEvent.BEGIN, this._addPagesToProject.bind( this ), null, 1000 );

		EventsExtra.for( this.application )
			.beforeOptionsFreeze( () => {
				if( this.pluginOptions.getValue().enablePageLinks ){
					this._markdownReplacer.registerInlineTag( '@page', EXTRACT_PAGE_LINK_REGEX, this._replacePageLink.bind( this ) );
				}
			} )
			.onThemeReady( this._pageTreeBuilder.bind( this ) )
			.onSetOption( `${this.optionsPrefix}:logLevel`, v => {
				this.logger.level = v as LogLevel;
			} );
	}

	/**
	 * Generate pages mappings & append {@link NodeReflection} to the project.
	 *
	 * @param event - The renderer event emitted at {@link RendererEvent.BEGIN}.
	 */
	private _addPagesToProject( event: RendererEvent ){
		this._pagesTree = this._pageTreeBuilder().buildPagesTree( event.project, this.pluginOptions.getValue() );
		const treeBuilder = this._pageTreeBuilder();
		this._mappings = treeBuilder.generateMappings( event, this._pagesTree );
		this.application.logger.info( `Generating ${this._mappings.length} pages` );
		event.urls = [ ...( event.urls ?? [] ), ...this._mappings ];
	}

	/**
	 * Transform the parsed page link.
	 *
	 * @param capture - The captured infos.
	 * @param sourceHint - The best guess to the source of the match,
	 * @returns the replaced content.
	 */
	private _replacePageLink(
		{ captures, fullMatch }: Parameters<MarkdownReplacer.ReplaceCallback>[0],
		sourceHint: Parameters<MarkdownReplacer.ReplaceCallback>[1],
	): ReturnType<MarkdownReplacer.ReplaceCallback> {
		assert( this._mappings );
		const mappings = this._mappings;

		const [ page, label ] = captures;
		assert( isString( page ) );
		const resolvedFile = this._pathReflectionResolver.resolveNamedPath(
			this._currentPageMemo.currentReflection.project,
			page,
			{
				currentReflection: this._currentPageMemo.currentReflection,
				containerFolder: this.pluginOptions.getValue().source,
			} );
		if( !resolvedFile ){
			this.logger.error( () => `In "${sourceHint()}", could not resolve page "${page}" from reflection ${this._currentPageMemo.currentReflection.name}` );
			return fullMatch;
		}
		const mapping = mappings.find( m => m.model.sourceFilePath === resolvedFile );
		if( !mapping ){
			this.logger.error( () => `In "${sourceHint()}", could not find a page for "${page}" (resolved as "${this.relativeToRoot( resolvedFile )}"). Known pages are ${JSON.stringify( mappings
				.map( m => this.relativeToRoot( m.model.sourceFilePath ) ) )}` );
			return fullMatch;
		} else {
			this.logger.verbose( () => `Created a link from "${sourceHint()}" to "${mapping.model.name}" (resolved as "${this.relativeToRoot( resolvedFile )}")` );
		}
		const link = this._pageTreeBuilder().renderPageLink( { label: label ?? undefined, mapping } );
		if( typeof link === 'string' ){
			return link;
		} else {
			return JSX.renderElement( link );
		}
	}
}
( {} as any as NodeReflection );
