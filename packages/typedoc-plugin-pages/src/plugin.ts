import assert from 'assert';

import { isString, once } from 'lodash';
import { Application, JSX, RendererEvent } from 'typedoc';

import { ABasePlugin, CurrentPageMemo, MarkdownReplacer, PathReflectionResolver } from '@knodes/typedoc-pluginutils';

import { buildOptions } from './options';
import { NodeReflection } from './reflections';
import { initThemePlugins } from './theme-plugins';

const EXTRACT_PAGE_LINK_REGEX = /{\\?@page\s+([^}\s]+)(?:\s+([^}]+?))?\s*}/g;
export class PagesPlugin extends ABasePlugin {
	public readonly pageTreeBuilder = once( () => initThemePlugins( this.application, this ) );
	public readonly pluginOptions = buildOptions( this );
	private readonly _currentPageMemo = new CurrentPageMemo( this );
	private readonly _pathReflectionResolver = new PathReflectionResolver( this );
	public constructor( application: Application ){
		super( application, __filename );
	}

	/**
	 * This method is called after the plugin has been instanciated.
	 */
	public override initialize(){
		const opts = this.pluginOptions.getValue();
		this.logger.level = opts.logLevel ?? this.application.logger.level;
		this.application.renderer.on( RendererEvent.BEGIN, this.addPagesToProject.bind( this ) );
		const markdownReplacer = new MarkdownReplacer( this );
		markdownReplacer.bindReplace( EXTRACT_PAGE_LINK_REGEX, this._replacePageLink.bind( this ) );
	}

	/**
	 * Generate pages mappings & append {@link NodeReflection} to the project.
	 *
	 * @param event - The renderer event emitted at {@link RendererEvent.BEGIN}.
	 */
	public addPagesToProject( event: RendererEvent ){
		const opts = this.pluginOptions.getValue();
		this.pageTreeBuilder().appendToProject( event, opts );
		this.application.logger.info( `Generating ${this.pageTreeBuilder().mappings.length} pages` );
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
		const resolvedFile = this._pathReflectionResolver.resolveNamedPath(
			this._currentPageMemo.currentReflection.project,
			page,
			{
				currentReflection: this._currentPageMemo.currentReflection,
				containerFolder: this.pluginOptions.getValue().source,
			} );
		if( !resolvedFile ){
			return fullMatch;
		}
		const builder = this.pageTreeBuilder();
		const { mappings } = builder;
		const mapping = mappings.find( m => m.model.sourceFilePath === resolvedFile );
		if( !mapping ){
			this.logger.error( () => `In "${sourceHint()}", could not find a page for "${page}" (resolved as "${this.relativeToRoot( resolvedFile )}"). Known pages are ${JSON.stringify( mappings
				.map( m => this.relativeToRoot( m.model.sourceFilePath ) ) )}` );
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
