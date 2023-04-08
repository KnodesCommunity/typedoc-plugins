import assert from 'assert';

import { isString, uniq } from 'lodash';
import { DeclarationReflection, ProjectReflection, RendererEvent } from 'typedoc';

import { CurrentPageMemo, IPluginComponent, MarkdownReplacer, findModuleRoot, getReflectionModule, getWorkspaces, reflectionSourceUtils } from '@knodes/typedoc-pluginutils';
import { dirname, join, normalize, relative, resolve } from '@knodes/typedoc-pluginutils/path';

import { IPagesPluginThemeMethods } from './theme';
import { getNodePath } from '../converter/page-tree';
import { PageReflection, PagesPluginReflectionKind } from '../models/reflections';
import { EInvalidPageLinkHandling } from '../options';
import type { PagesPlugin } from '../plugin';

const EXTRACT_PAGE_LINK_REGEX = /([^}\s]+)(?:\s+([^}]+?))?\s*/g;
export class MarkdownPagesLinks implements IPluginComponent<PagesPlugin> {
	private readonly _currentPageMemo = CurrentPageMemo.for( this );
	private readonly _markdownReplacer = new MarkdownReplacer( this );
	private readonly _logger = this.plugin.logger.makeChildLogger( MarkdownPagesLinks.name );
	private readonly _nodesReflections: PageReflection[];
	private readonly _workspacesRoots: Map<ProjectReflection | DeclarationReflection, string>;
	public constructor( public readonly plugin: PagesPlugin, private readonly _themeMethods: IPagesPluginThemeMethods, event: RendererEvent ){
		const nodeReflections = event.project.getReflectionsByKind( PagesPluginReflectionKind.PAGE as any );
		assert( nodeReflections.every( ( v ): v is PageReflection => v instanceof PageReflection ) );
		this._nodesReflections = nodeReflections;
		this._workspacesRoots = new Map( getWorkspaces( event.project ).map( workspace => [ workspace, findModuleRoot( workspace ) ] ) );
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
		sourceHint: MarkdownReplacer.SourceHint,
	): ReturnType<MarkdownReplacer.ReplaceCallback> {
		const [ page, label ] = captures;

		try {
			const targetPage = this._resolvePageLink( page, sourceHint );
			if( targetPage ){
				this._logger.verbose( () => `Created a link from ${sourceHint()} to ${getNodePath( targetPage )}` );
				return this._themeMethods.renderPageLink( { label: label ?? undefined, page: targetPage } );
			}
		} catch( err: any ){
			this._handleResolveError( err, page, sourceHint );
		}
		return undefined;
	}

	/**
	 * Handle a page resolution error according to user options.
	 *
	 * @param err - The error thrown.
	 * @param page - The page in the inline tag.
	 * @param sourceHint - The best guess to the source of the match,
	 */
	private _handleResolveError( err: any, page: string | null, sourceHint: MarkdownReplacer.SourceHint ) {
		const message = `Could not resolve page "${page}" from reflection ${this._currentPageMemo.currentReflection.name}: ${err.message ?? err}`;
		switch( this.plugin.pluginOptions.getValue().invalidPageLinkHandling ){
			case EInvalidPageLinkHandling.FAIL: {
				throw new Error( message, { cause: err } );
			}
			case EInvalidPageLinkHandling.LOG_ERROR: {
				this._logger.error( `In ${sourceHint()}: ${message}` );
			} break;
			case EInvalidPageLinkHandling.LOG_WARN: {
				this._logger.warn( `In ${sourceHint()}: ${message}` );
			} break;
			case EInvalidPageLinkHandling.NONE: {
				this._logger.verbose( `In ${sourceHint()}: ${message}` );
			} break;
			default: {
				assert.fail( `Invalid \`invalidPageLinkHandling\` option value ${this.plugin.pluginOptions.getValue().invalidPageLinkHandling}` );
			}
		}
	}

	/**
	 * Find the actual page that matches the given page alias.
	 *
	 * @param pageSpecifier - The page alias, usually in the form of a {@link NamedPath}.
	 * @param sourceHint - The best guess to the source of the match,
	 * @returns the resolved page.
	 */
	private _resolvePageLink( pageSpecifier: string | null, sourceHint: MarkdownReplacer.SourceHint ){
		assert( this._nodesReflections );
		assert( isString( pageSpecifier ) );
		if( pageSpecifier.endsWith( '.md' ) ){
			this._logger.warn( `In ${sourceHint()}: specifying ".md" extension is deprecated. You now should only provide the base name of the page` );
			pageSpecifier = pageSpecifier.slice( 0, -3 );
		}
		const currentReflectionModule = getReflectionModule( this._currentPageMemo.currentReflection );
		const currentReflectionModuleName = currentReflectionModule instanceof ProjectReflection ? '~' : currentReflectionModule.name;
		const [ , moduleQualifier, path ] = pageSpecifier.match( /^(~[^:]*)?(?::?(.*))?$/ ) ?? assert.fail( 'Could not parse page specifier' );
		const defaultedModuleQualifier = !moduleQualifier || moduleQualifier === '~'  ? `~${currentReflectionModuleName}` : moduleQualifier;
		const linkModuleBase = this.plugin.pluginOptions.getValue().linkModuleBase ?? '.';

		let pages: PageReflection[];
		if( !path ){
			pages = this._getPagesMatchingAlias( defaultedModuleQualifier, defaultedModuleQualifier.slice( 1 ) );
			assert.notEqual( pages.length, 0, new Error( 'Page not found' ) );
			if( pages.length > 1 ){
				this._logger.warn( `Multiple pages matched the page alias ${pageSpecifier}: ${pages.map( p => p.name )}` );
			}
			return pages[0];
		} else {
			const resolvedPath = normalize( path );
			const searchFromDir = moduleQualifier === undefined && path.match( /^\.{1,2}\// ) ?
				dirname( reflectionSourceUtils.getReflectionSourceFileName( this._currentPageMemo.currentReflection ) ?? assert.fail() ) :
				join( this._getModuleRootByModuleQualifier( defaultedModuleQualifier ) ?? assert.fail(), linkModuleBase );
			const approximateAbsoluteTargetPath = resolve(
				searchFromDir,
				resolvedPath );
			const modulesContainingTarget = [ ...this._workspacesRoots.entries() ]
				.map( ( [ reflection, reflectionPath ] ) => [
					relative( reflectionPath, approximateAbsoluteTargetPath ),
					reflection,
				] as const )
				.filter( ( [ toTargetPath ] ) => !toTargetPath.startsWith( '../' ) )
				// Prefer shorter paths
				.sort( ( [ a ], [ b ] ) => a.length - b.length );
			pages = uniq( modulesContainingTarget.flatMap( ( [ modPath, module ] ) => this._getPagesMatchingAlias( `~${module instanceof ProjectReflection ? '~' : module.name}`, modPath ) ) );
		}
		assert.notEqual( pages.length, 0, new Error( 'Page not found' ) );
		if( pages.length > 1 ){
			this._logger.warn( `Multiple pages matched the page alias ${pageSpecifier}: ${pages.map( p => p.name )}` );
		}
		return pages[0];
	}

	/**
	 * Find the module or project by module qualifier.
	 *
	 * @param qualifier - The qualifier to search.
	 * @returns the module.
	 */
	private _getModuleRootByModuleQualifier( qualifier: string ){
		const moduleName = qualifier.slice( 1 );
		if( moduleName === '~' ){
			return [ ...this._workspacesRoots.entries() ].find( ( [ reflection ] ) => reflection instanceof ProjectReflection )?.[1];
		}
		return [ ...this._workspacesRoots.entries() ].find( ( [ reflection ] ) => reflection instanceof DeclarationReflection && reflection.name === moduleName )?.[1];
	}

	/**
	 * Find all pages that match the given virtual path like `{@link moduleQualifier}:{@link path}`.
	 *
	 * @param moduleQualifier - The module qualifier.
	 * @param path - The path of the page in the module
	 * @returns the list of matched pages (usually 1).
	 */
	private _getPagesMatchingAlias( moduleQualifier: string, path: string ) {
		const resolvedPageAlias = `${moduleQualifier}:${path}`;
		return this._nodesReflections.filter( m => m.matchVirtualPath( resolvedPageAlias ) );
	}
}
export const bindReplaceMarkdown = ( plugin: PagesPlugin, themeMethods: IPagesPluginThemeMethods, event: RendererEvent ) => new MarkdownPagesLinks( plugin, themeMethods, event );
