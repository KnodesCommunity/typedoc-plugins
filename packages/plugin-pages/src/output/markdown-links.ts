import assert from 'assert';

import { isString } from 'lodash';
import { RendererEvent } from 'typedoc';

import { CurrentPageMemo, IPluginComponent, MarkdownReplacer, NamedPath, resolveNamedPath } from '@knodes/typedoc-pluginutils';

import { getNodePath } from '../converter/page-tree';
import { PageReflection, PagesPluginReflectionKind } from '../models/reflections';
import { EInvalidPageLinkHandling } from '../options';
import type { PagesPlugin } from '../plugin';
import { IPagesPluginThemeMethods } from './theme';

const EXTRACT_PAGE_LINK_REGEX = /([^}\s]+)(?:\s+([^}]+?))?\s*/g;
class MarkdownPagesLinks implements IPluginComponent<PagesPlugin> {
	private readonly _currentPageMemo = CurrentPageMemo.for( this );
	private readonly _markdownReplacer = new MarkdownReplacer( this );
	private readonly _logger = this.plugin.logger.makeChildLogger( MarkdownPagesLinks.name );
	private readonly _nodesReflections: PageReflection[];
	public constructor( public readonly plugin: PagesPlugin, private readonly _themeMethods: IPagesPluginThemeMethods, event: RendererEvent ){
		const nodeReflections = event.project.getReflectionsByKind( PagesPluginReflectionKind.PAGE as any );
		assert( nodeReflections.every( ( v ): v is PageReflection => v instanceof PageReflection ) );
		this._nodesReflections = nodeReflections;
		this._markdownReplacer.registerMarkdownTag( '@page', EXTRACT_PAGE_LINK_REGEX, this._replacePageLink.bind( this ), {
			excludedMatches: this.plugin.pluginOptions.getValue().excludeMarkdownTags,
		} );
		this._currentPageMemo.initialize();
	}

	/**
	 * Transform the parsed page link.
	 *
	 * @param capture - The captured infos.
	 * @param sourceHint - The best guess to the source of the match,
	 * @returns the replaced content.
	 */
	private _replacePageLink(
		{ captures }: Parameters<MarkdownReplacer.ReplaceCallback>[0],
		sourceHint: Parameters<MarkdownReplacer.ReplaceCallback>[1],
	): ReturnType<MarkdownReplacer.ReplaceCallback> {
		const [ page, label ] = captures;

		try {
			const targetPage = this._resolvePageLink( page );
			if( targetPage ){
				this._logger.verbose( () => `Created a link from "${sourceHint()}" to ${getNodePath( targetPage )}` );
				return this._themeMethods.renderPageLink( { label: label ?? undefined, page: targetPage } );
			}
		} catch( err: any ){
			const message = `In "${sourceHint()}", could not resolve page "${page}" from reflection ${this._currentPageMemo.currentReflection.name}: ${err}`;
			switch( this.plugin.pluginOptions.getValue().invalidPageLinkHandling ){
				case EInvalidPageLinkHandling.FAIL: {
					throw new Error( message, { cause: err } );
				}
				case EInvalidPageLinkHandling.LOG_ERROR: {
					this._logger.error( message );
				} break;
				case EInvalidPageLinkHandling.LOG_WARN: {
					this._logger.warn( message );
				} break;
				case EInvalidPageLinkHandling.NONE: {
					this._logger.verbose( message );
				} break;
				default: {
					assert.fail( `Invalid \`invalidPageLinkHandling\` option value ${this.plugin.pluginOptions.getValue().invalidPageLinkHandling}` );
				}
			}
		}
	}

	/**
	 * Find the actual page that matches the given page alias.
	 *
	 * @param pageAlias - The page alias, usually in the form of a {@link NamedPath}.
	 * @returns the resolved page.
	 */
	private _resolvePageLink( pageAlias: string | null ){
		assert( this._nodesReflections );
		assert( isString( pageAlias ) );
		const resolvedFile = resolveNamedPath(
			this._currentPageMemo.currentReflection,
			this.plugin.pluginOptions.getValue().source ?? undefined,
			pageAlias as NamedPath );
		const page = this._nodesReflections.find( m => m.sourceFilePath === resolvedFile );
		assert( page, new Error( 'Page not found' ) );
		return page;
	}
}
export const bindReplaceMarkdown = ( plugin: PagesPlugin, themeMethods: IPagesPluginThemeMethods, event: RendererEvent ) => new MarkdownPagesLinks( plugin, themeMethods, event );
