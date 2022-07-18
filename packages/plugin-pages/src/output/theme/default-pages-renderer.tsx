import assert from 'assert';
import { copyFileSync } from 'fs';
import { join } from 'path';

import { isString } from 'lodash';
import { DeclarationReflection, DefaultTheme, IndexEvent, JSX, PageEvent, ProjectReflection, Reflection, ReflectionKind, RendererEvent, UrlMapping } from 'typedoc';

import { IPluginComponent, getReflectionModule } from '@knodes/typedoc-pluginutils';

import { ANodeReflection, PageReflection, PagesPluginReflectionKind } from '../../models/reflections';
import type { PagesPlugin } from '../../plugin';
import { IPagesPluginThemeMethods, RenderPageLinkProps } from './types';

const getPageNameComponents = ( reflection: Reflection ): string[] => reflection.parent instanceof ANodeReflection ?
	[ ...getPageNameComponents( reflection.parent ), reflection.name ] :
	[];
const getFullPageName = ( page: PageReflection ) => getPageNameComponents( page ).join( ' > ' );

const CSS_FILE_NAME = 'assets/pages.css';
export class DefaultPagesRenderer implements IPagesPluginThemeMethods, IPluginComponent<PagesPlugin> {
	private readonly _theme: DefaultTheme;
	private readonly _modulesPages: ANodeReflection[];
	private readonly _allPages: PageReflection[];
	private readonly _nodeDeclarationMappingCache = new WeakMap<ANodeReflection, DeclarationReflection>();
	private _renderPageRestore?: () => void;
	public constructor( public readonly plugin: PagesPlugin, event: RendererEvent ){
		assert( plugin.application.renderer.theme instanceof DefaultTheme );
		this._theme = plugin.application.renderer.theme;

		const modulesPages = event.project.getReflectionsByKind( PagesPluginReflectionKind.ROOT as any );
		assert( modulesPages.every( ( n ): n is ANodeReflection => n instanceof ANodeReflection ) );
		this._modulesPages = modulesPages;
		modulesPages.forEach( n => this._mapNode( n ) );

		const pages = event.project.getReflectionsByKind( PagesPluginReflectionKind.PAGE as any ).filter( p => !p.kindOf( PagesPluginReflectionKind.ROOT as any ) );
		assert( pages.every( ( n ): n is PageReflection => n instanceof PageReflection ) );
		this._allPages = pages;
		event.urls = [ ...( event.urls ?? [] ), ...pages.map( p => new UrlMapping( p.url, p, this._renderPage.bind( this ) ) ) ];

		plugin.application.renderer.on( PageEvent.BEGIN, this._onRendererBeginPage.bind( this ) );
		plugin.application.renderer.on( PageEvent.END, this._onRendererEndPage.bind( this ) );
		plugin.application.renderer.on( RendererEvent.END, this._onRendererEnd.bind( this ) );
		plugin.application.renderer.hooks.on( 'head.end', context => <link rel="stylesheet" href={context.relativeURL( CSS_FILE_NAME )} /> );
		plugin.application.renderer.on( IndexEvent.PREPARE_INDEX, this._onRendererPrepareIndex.bind( this ) );
	}

	/**
	 * Render a link to a given page.
	 *
	 * @param root0 - The rendering context with the target page & label.
	 * @returns the generated link.
	 */
	public renderPageLink( { page, label }: RenderPageLinkProps ): JSX.Element {
		return <a href={this._theme.markedPlugin.getRelativeUrl( page.url )}>{label ?? page.originalName}</a>;
	}

	/**
	 * Render a single page reflection.
	 *
	 * @param props - The page event for the page reflection.
	 * @returns the rendered page.
	 */
	private _renderPage( props: PageEvent<PageReflection> ): JSX.Element {
		const { icons } = this._theme.getRenderContext( props );
		const icon = () => icons[ReflectionKind.Module]();
		( icons as any )[PagesPluginReflectionKind.PAGE] = icon;
		( icons as any )[PagesPluginReflectionKind.PAGE | PagesPluginReflectionKind.ROOT] = icon;
		( icons as any )[PagesPluginReflectionKind.MENU] = icon;
		( icons as any )[PagesPluginReflectionKind.MENU | PagesPluginReflectionKind.ROOT] = icon;

		const castedProps: PageEvent<ProjectReflection> = props as any;
		return this._theme.indexTemplate( castedProps );
	}

	/**
	 * Map a node reflection to a similar declaration, mimicing Typedoc default rendering process.
	 *
	 * @param node - The node to map.
	 * @param parent - The parent to set on the node (for recursive calls).
	 * @returns the new declaration reflection.
	 */
	private _mapNode( node: ANodeReflection, parent: Reflection = node.module ): DeclarationReflection {
		const declaration = new DeclarationReflection( node.name, ReflectionKind.Namespace, parent );
		declaration.url = node instanceof PageReflection ? node.url : undefined;
		declaration.children = node.childrenNodes?.map( c => this._mapNode( c, node.isModuleAppendix ? node.module : declaration ) );
		declaration.cssClasses = [
			'pages-entry',
			`pages-entry-${node instanceof PageReflection ? 'page' : 'menu'}`,
			`pages-entry-depth-${node.depth}`,
		].filter( isString ).join( ' ' );
		declaration.readme = node.comment?.summary;
		declaration.sources = node.sources;
		this._nodeDeclarationMappingCache.set( node, declaration );
		return declaration;
	}

	/**
	 * Append a new restoration hook to execute on page rendering end.
	 *
	 * @see _onRendererBeginPage
	 * @see _onRendererEndPage
	 * @param collect - A function to get the current state.
	 * @param fn - A function executed with the state retrieved via {@link collect} that restores the previous state.
	 */
	private _addRestore<T>( collect: () => T, fn: ( data: T ) => void ){
		const collected = collect();
		const restore = this._renderPageRestore;
		this._renderPageRestore = () => {
			restore?.();
			fn( collected );
		};
	}

	/**
	 * Retrieve declaration reflections that are mirrors of inputted node reflections.
	 *
	 * @param nodeReflections - The node reflections to map.
	 * @returns the mapped node reflections.
	 */
	private _mapNodeReflectionsToDeclarations( nodeReflections?: ANodeReflection[] ){
		return nodeReflections?.map( cc => {
			const node = this._nodeDeclarationMappingCache.get( cc );
			assert( node );
			return node;
		} ) ?? [];
	}

	/**
	 * Event callback executed on every page on {@link PageEvent.BEGIN}.
	 *
	 * @see _onRendererBeginPageAlterModel
	 * @see _onRendererBeginPageAlterNavigation
	 * @param pageEvent - The page event to alter.
	 */
	private _onRendererBeginPage( pageEvent: PageEvent<any> ){
		this._onRendererBeginPageAlterModel( pageEvent );
		this._onRendererBeginPageAlterNavigation( pageEvent );
	}

	/**
	 * Partial implementation of {@link _onRendererBeginPage} that prepares the navigation for a single page.
	 *
	 * @param pageEvent - The page event to alter.
	 */
	private _onRendererBeginPageAlterNavigation( pageEvent: PageEvent<any> ) {
		this._addRestore( () => pageEvent.project.children, prev => pageEvent.project.children = prev );
		const modelModule = getReflectionModule( pageEvent.model );
		const projectPages = this._modulesPages.find( p => p.module === pageEvent.project );
		pageEvent.project.children = [
			...this._mapNodeReflectionsToDeclarations( projectPages?.childrenNodes ),
			...( pageEvent.project.children ?? [] ).map( projectChild => {
				if( projectChild.kindOf( ReflectionKind.Module ) && modelModule === projectChild ) {
					const modulePage = this._modulesPages.find( p => p.module === projectChild );
					if( modulePage ){
						this._addRestore( () => projectChild.children, prev => projectChild.children = prev );
						projectChild.children = [
							...this._mapNodeReflectionsToDeclarations( modulePage.childrenNodes ),
							...( projectChild.children ?? [] ),
						];
					}
				}
				return projectChild;
			} ),
		];
	}

	/**
	 * Partial implementation of {@link _onRendererBeginPage} responsible of modifying the page mode. Node reflections are replaced with a similar declaration,
	 * and modules/projects are prepended with root pages sources.
	 *
	 * @param pageEvent - The page event to alter.
	 */
	private _onRendererBeginPageAlterModel( pageEvent: PageEvent<any> ) {
		if( pageEvent.model instanceof ANodeReflection ){
			const newModel = this._nodeDeclarationMappingCache.get( pageEvent.model );
			assert( newModel );
			this._addRestore( () => newModel.children, v => newModel.children = v );
			newModel.children = [
				...( newModel.children ?? [] ),
				...( pageEvent.model.module.children?.filter( c => !c.kindOf( ReflectionKind.SomeModule ) ) ?? [] ),
			];
			pageEvent.model = newModel;
		} else if( pageEvent.model instanceof ProjectReflection || ( pageEvent.model instanceof Reflection && pageEvent.model.kindOf( ReflectionKind.Module ) ) ){
			const modulePage = this._modulesPages.find( p => p.module === pageEvent.model );
			if( modulePage instanceof PageReflection ){
				const prevTemplate = pageEvent.template;
				const fakeProject = new ProjectReflection( modulePage.name );
				fakeProject.readme = modulePage.comment?.summary;
				fakeProject.sources = modulePage.sources;
				const fakePageEvent = new PageEvent<ProjectReflection>( modulePage.name );
				fakePageEvent.project = modulePage.project;
				fakePageEvent.url = modulePage.url;
				fakePageEvent.model = fakeProject;
				pageEvent.template = props => <>
					{this._theme.indexTemplate( fakePageEvent )}
					<hr/>
					{prevTemplate( props )}
				</>;
			}
		}
	}

	/**
	 * Event callback executed on every page on {@link PageEvent.END}.
	 * It undoes changes made by {@link _onRendererBeginPage}.
	 *
	 * @param _pageEvent - The page event to alter.
	 */
	private _onRendererEndPage( _pageEvent: PageEvent<any> ){
		assert( this._renderPageRestore );
		this._renderPageRestore();
	}
	/**
	 * Event callback executed once on {@link RendererEvent.END}.
	 * Copy assets to the output directory.
	 *
	 * @param event - The {@link RendererEvent.END} event.
	 */
	private _onRendererEnd( event: RendererEvent ) {
		const dest = join( event.outputDirectory, CSS_FILE_NAME );
		const src = this.plugin.resolvePackageFile( 'static/pages.css' );
		copyFileSync( src, dest );
	}

	/**
	 * Event callback executed once on {@link IndexEvent.PREPARE_INDEX}.
	 * Adds the plugin's pages to the search index.
	 *
	 * @param indexEvent - The original index event.
	 */
	private _onRendererPrepareIndex( indexEvent: IndexEvent ) {
		indexEvent.searchResults = [
			...indexEvent.searchResults,
			...this._allPages.map( r => {
				const searchResPage = new DeclarationReflection( getFullPageName( r ), PagesPluginReflectionKind.PAGE as any, undefined );
				searchResPage.cssClasses = 'pages-entry pages-entry-page';
				searchResPage.url = r.url;
				return searchResPage;
			} ),
		];
	}
}
