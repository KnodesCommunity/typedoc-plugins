import assert from 'assert';
import { join } from 'path';

import { isNumber, once } from 'lodash';
import { Application, JSX, LogLevel, MarkdownEvent, PageEvent, ParameterType, Reflection, RendererEvent } from 'typedoc';

import { ABasePlugin } from '@knodes/typedoc-pluginutils';

import { IPluginOptions, readPluginOptions } from './options';
import { getPageTreeBuilder } from './page-tree';
import { NodeReflection } from './reflections';
import { MergeExclusive } from 'type-fest';

const EXTRACT_PAGE_LINK_REGEX = /{@page\s+([^}\s]+)(?:\s+([^}]+?))?\s*}/;
export class PagesPlugin extends ABasePlugin {
	public readonly pageTreeBuilder = once( () => getPageTreeBuilder( this.application, this ) );
	private _currentPageEvent?: PageEvent;
	private readonly _pluginOptions = this.addOption<MergeExclusive<IPluginOptions, {logLevel: LogLevel}>>( {
		name: '__',
		help: 'Configuration or the path to the pages configuration file.',
		type: ParameterType.Mixed,
		mapper: readPluginOptions,
	} );
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
		this.application.renderer.on( MarkdownEvent.PARSE, this._processMarkdown.bind( this ) );
		this.application.renderer.on( PageEvent.BEGIN, ( e: PageEvent ) => this._currentPageEvent = e );
		this.application.renderer.on( PageEvent.END, () => this._currentPageEvent = undefined );
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
	 * Transform the parsed text of the given {@link event MarkdownEvent} to replace page links.
	 *
	 * @param event - The event to modify.
	 */
	private _processMarkdown( event: MarkdownEvent ) {
		assert( this._currentPageEvent );
		const opts = this._pluginOptions.getValue();
		const pageEvent =  this._currentPageEvent;
		const regex = new RegExp( EXTRACT_PAGE_LINK_REGEX.toString().slice( 1, -1 ), 'g' );
		event.parsedText = event.parsedText.replace(
			regex,
			fullmatch => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Re-run the exact same regex.
				const [ , page, label ] = fullmatch.match( EXTRACT_PAGE_LINK_REGEX )!;
				const prefixedPage = opts.source ? join( opts.source, page ) : page;
				const mapping = this.pageTreeBuilder().mappings.find( m => m.model.filename === prefixedPage );
				assert( pageEvent.model instanceof Reflection );
				if( !mapping ){
					this.logger.makeChildLogger( pageEvent.model.sources?.[0].fileName ?? pageEvent.model.name ).error( `Could not find a page for ${page}` );
					return label;
				}
				const link = this.pageTreeBuilder().renderPageLink( { event: pageEvent, label, mapping } );
				if( typeof link === 'string' ){
					return link;
				} else {
					return JSX.renderElement( link );
				}
			} );
	}
}
( {} as any as NodeReflection );
