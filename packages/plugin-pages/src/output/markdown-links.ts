import assert from 'assert';

import { isString } from 'lodash';
import { RendererEvent } from 'typedoc';

import { CurrentPageMemo, IPluginComponent, MarkdownReplacer, NamedPath, resolveNamedPath } from '@knodes/typedoc-pluginutils';

import { getNodePath } from '../converter/page-tree';
import { PageReflection, PagesPluginReflectionKind } from '../models/reflections';
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
		this._markdownReplacer.registerMarkdownTag( '@page', EXTRACT_PAGE_LINK_REGEX, this._replacePageLink.bind( this ) );
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
		{ captures, fullMatch }: Parameters<MarkdownReplacer.ReplaceCallback>[0],
		sourceHint: Parameters<MarkdownReplacer.ReplaceCallback>[1],
	): ReturnType<MarkdownReplacer.ReplaceCallback> {
		if( ( this.plugin.pluginOptions.getValue().excludeMarkdownTags ?? [] ).includes( fullMatch ) ){
			this._logger.verbose( () => `Skipping excluded markup ${JSON.stringify( fullMatch )} from "${sourceHint()}"` );
			return;
		}
		const [ page, label ] = captures;

		const targetPage = this._resolvePageLink( page );
		if( targetPage ){
			this._logger.verbose( () => `Created a link from "${sourceHint()}" to ${getNodePath( targetPage )}` );
			return this._themeMethods.renderPageLink( { label: label ?? undefined, page: targetPage } );
		} else {
			this._logger.error( () => `In "${sourceHint()}", could not resolve page "${page}" from reflection ${this._currentPageMemo.currentReflection.name}` );
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
		try {
			const resolvedFile = resolveNamedPath(
				this._currentPageMemo.currentReflection,
				this.plugin.pluginOptions.getValue().source,
				pageAlias as NamedPath );
			const page = this._nodesReflections.find( m => m.sourceFilePath === resolvedFile );
			return page;
		} catch( _err ){
			return null;
		}
	}
}
export const bindReplaceMarkdown = ( plugin: PagesPlugin, themeMethods: IPagesPluginThemeMethods, event: RendererEvent ) => new MarkdownPagesLinks( plugin, themeMethods, event );
