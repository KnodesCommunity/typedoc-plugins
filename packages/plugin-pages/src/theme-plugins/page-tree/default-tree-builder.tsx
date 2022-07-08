import assert from 'assert';
import { copyFileSync } from 'fs';
import { join } from 'path';

import {
	ContainerReflection,
	DeclarationReflection,
	DefaultTheme,
	IndexEvent,
	JSX,
	PageEvent,
	ProjectReflection,
	Reflection,
	ReflectionKind,
	RenderTemplate,
	RendererEvent,
	UrlMapping,
} from 'typedoc';

import type { PagesPlugin } from '../../plugin';
import { ANodeReflection, MenuReflection, NodeReflection, PageReflection, PagesPluginReflectionKind } from '../../reflections';
import { RenderPageLinkProps } from '../../theme';
import { APageTreeBuilder } from './a-page-tree-builder';
import { appendChildren, getNodePath, linkReflections, popReflection, traverseDeep } from './utils';

const treeShakeProject = ( project: ProjectReflection, preserveModule?: Reflection ) => project.children?.reduce<Array<() => void>>( ( acc, c ) => {
	if( !( c instanceof ANodeReflection ) && c.kindOf( ReflectionKind.SomeModule ) && c !== preserveModule ){
		acc.push( filterChildrenWithBackup( c, cc => !( cc instanceof ANodeReflection ) ) );
	}
	return acc;
}, [] ) ?? [];

const filterChildrenWithBackup = ( reflection: ContainerReflection, filter: ( v: DeclarationReflection ) => boolean ): () => void => {
	const childrenBackup = reflection.children ? [ ...reflection.children ] : reflection.children;
	reflection.children = reflection.children?.filter( filter );
	return () => reflection.children = childrenBackup;
};

const getPageNameComponents = ( reflection: Reflection ): string[] => reflection.parent instanceof ANodeReflection ?
	[ ...getPageNameComponents( reflection.parent ), reflection.name ] :
	[ reflection.name ];
const getFullPageName = ( page: PageReflection ) => getPageNameComponents( page ).join( ' > ' );

const CSS_FILE_NAME = 'assets/pages.css';
export class DefaultTreeBuilder extends APageTreeBuilder {
	private _renderPageCleanup?: () => void;

	public constructor( protected override readonly theme: DefaultTheme, plugin: PagesPlugin ){
		super( theme, plugin );
		const { renderer } = theme.application;
		// Add stylesheet
		renderer.on( RendererEvent.END, this._onRenderEnd.bind( this ) );
		renderer.hooks.on( 'head.end', context => <link rel="stylesheet" href={context.relativeURL( CSS_FILE_NAME )} /> );
		renderer.on( PageEvent.BEGIN, this._hookOnRenderPageStart.bind( this ) );
		renderer.on( PageEvent.END, this._hookOnRenderPageEnd.bind( this ) );
		renderer.on( IndexEvent.PREPARE_INDEX, ( indexEvent: IndexEvent ) => {
			indexEvent.searchResults = indexEvent.searchResults.map( r => {
				if( r instanceof PageReflection ){
					const searchResPage = new PageReflection( getFullPageName( r ), PagesPluginReflectionKind.PAGE as any, r.module, r.project, r.sourceFilePath, r.url );
					searchResPage.cssClasses = 'pages-entry pages-entry-page';
					return searchResPage;
				} else {
					return r;
				}
			} );
		} );
	}

	public renderPageLink: RenderTemplate<RenderPageLinkProps> = ( { mapping, label } ): JSX.Element =>
		<a href={this.theme.markedPlugin.getRelativeUrl( mapping.url )}>{label ?? mapping.model.originalName}</a>;

	/**
	 * Generate mappings (pages) from the given node reflections.
	 * This method includes a hack to override typedoc default reflection tree.
	 *
	 * @param event - The render event to affect.
	 * @param reflections - The list of node reflections (pages & menu).
	 * @returns the list of mappings to create.
	 */
	public override generateMappings( event: RendererEvent, reflections: readonly NodeReflection[] ): Array<UrlMapping<PageReflection>> {
		// List of pages that maps to module roots. The page content is prepended to the module docs page
		const modulePagesReflections: PageReflection[] = [];
		// List of menu items that maps to module roots.
		const moduleMenuReflections: NodeReflection[] = [];
		const pagesReflections: PageReflection[] = [];
		const menuReflections: NodeReflection[] = [];
		const harvestReflection = ( reflection: Reflection ) => {
			// Remove empty menus
			if( reflection instanceof MenuReflection && ( reflection.children ?? [] ).length === 0 ){
				return popReflection( reflection );
			}
			// Remove module roots
			if( reflection instanceof ANodeReflection && reflection.isModuleAppendix ){
				if( reflection instanceof PageReflection ){
					modulePagesReflections.push( reflection );
				} else if( reflection instanceof MenuReflection ){
					moduleMenuReflections.push( reflection );
				}
				return;
			}
			if( reflection instanceof PageReflection ){
				pagesReflections.push( reflection );
			} else if( reflection instanceof MenuReflection ){
				menuReflections.push( reflection );
			}
		};
		traverseDeep( reflections, r => harvestReflection( r ) );

		const moduleNodeReflections = [ ...modulePagesReflections, ...moduleMenuReflections ];
		// Remove module nodes
		moduleNodeReflections.forEach( r => {
			popReflection( r );
			r.module.children = r.module.children?.filter( c => c !== r );
		} );

		const nodeReflections = [ ...pagesReflections, ...menuReflections ];
		traverseDeep( nodeReflections, r => event.project.registerReflection( r ) );
		modulePagesReflections.forEach( mpr => {
			// Get mapping to modify
			const moduleMapping = event.urls?.find( u => u.model === mpr.module );
			assert( moduleMapping );
			mpr.url = moduleMapping.url;

			this.plugin.logger.verbose( `Merging page ${getNodePath( mpr )} with reflection ${moduleMapping.model.name} at URL ${mpr.url}` );

			// Prepend page to module index
			const baseTemplate = moduleMapping.template;
			moduleMapping.template = props => {
				const fakeProject = new ProjectReflection( props.name );
				fakeProject.readme = mpr.comment?.summary;
				fakeProject.sources = mpr.sources;
				const fakePageEvent = new PageEvent<ProjectReflection>( props.name );
				fakePageEvent.filename = props.filename;
				fakePageEvent.project = props.project;
				fakePageEvent.url = props.url;
				fakePageEvent.model = fakeProject;
				const readme = this.theme.indexTemplate( fakePageEvent );
				const base = baseTemplate( props );
				return JSX.createElement( JSX.Fragment, null, ...[
					readme,
					JSX.createElement( 'hr', null ),
					base,
				] );
			};
		} );
		return pagesReflections.map( pr => {
			this.plugin.logger.verbose( `Adding page ${getNodePath( pr )} at URL ${pr.url}` );
			return new UrlMapping( pr.url, pr, this._renderPage );
		} );
	}

	/**
	 * In fallback mode, all page nodes are identified as {@link ReflectionKind.Namespace}.
	 *
	 * @returns the namespace reflection kind.
	 */
	protected override getReflectionKind(): ReflectionKind {
		return ReflectionKind.Namespace;
	}

	/**
	 * Register the {@link nodeReflection} into the correct reflection (project or module).
	 *
	 * @param nodeReflection - The node reflection.
	 */
	protected override addNodeToProjectAsChild( nodeReflection: NodeReflection ): void {
		nodeReflection.cssClasses = [
			'pages-entry',
			nodeReflection instanceof PageReflection ? 'pages-entry-page' : 'pages-entry-menu',
			`pages-entry-depth-${nodeReflection.depth}`,
			...( nodeReflection.cssClasses?.split( ' ' ) ?? [] ),
		].join( ' ' );
		const parentChildren = nodeReflection.parent.children ?? [];
		if( nodeReflection.parent === nodeReflection.project ){
			const lastPageIndexRev = parentChildren.slice().reverse().findIndex( r => r instanceof ANodeReflection );
			const lastPageIndex = lastPageIndexRev === -1 ? 0 : parentChildren.length - lastPageIndexRev;
			linkReflections( nodeReflection.parent, [
				...parentChildren.slice( 0, lastPageIndex ),
				nodeReflection,
				...parentChildren.slice( lastPageIndex ),
			], true );
		} else {
			linkReflections( nodeReflection.parent, [
				...parentChildren,
				nodeReflection,
			], true );
		}
	}

	private readonly _renderPage: RenderTemplate<PageEvent<PageReflection>> = props => {
		const castedProps: PageEvent<ProjectReflection> = props as any;
		castedProps.model.readme = props.model.comment?.summary;
		return this.theme.indexTemplate( castedProps );
	};
	/**
	 * Copy assets to the output directory.
	 *
	 * @param event - The {@link RendererEvent.END} event.
	 */
	private _onRenderEnd( event: RendererEvent ) {
		const dest = join( event.outputDirectory, CSS_FILE_NAME );
		const src = this.plugin.resolvePackageFile( 'static/pages.css' );
		copyFileSync( src, dest );
	}

	/**
	 * Get the module/project the given reflection is attached to.
	 *
	 * @param reflection - The reflection to search from.
	 * @returns the project or module of the reflection.
	 */
	private _getModuleOfDeclaration( reflection: DeclarationReflection ){
		let refIter: Reflection | undefined = reflection;
		while( refIter ) {
			if( refIter.kindOf( ReflectionKind.SomeModule ) || refIter instanceof ProjectReflection ){
				return refIter;
			}
			refIter = reflection.parent;
		}
		throw new Error( `Could not get module of ${reflection.name}` );
	}

	/**
	 * Alter pages nodes for a single page rendering. Modified tree **must** be restored once render ends.
	 *
	 * @param event - The page event.
	 */
	private _hookOnRenderPageStart( event: PageEvent ){
		assert( !this._renderPageCleanup );
		const intermediateCleanups: Array<() => void> = [];
		this._renderPageCleanup = () => {
			intermediateCleanups.forEach( c => c() );
			intermediateCleanups.splice( 0, intermediateCleanups.length );
		};

		const { model, project } = event;
		if( model instanceof ProjectReflection ){ // When rendering the root module
			intermediateCleanups.push( ...treeShakeProject( project ) );
		} else if( model instanceof ANodeReflection ){
			intermediateCleanups.push( ...treeShakeProject( project, model.module ) );
			const prevPageChildren = model.children?.slice();
			appendChildren( model, ...( model.module.children ?? [] ).filter( c => !( c instanceof ANodeReflection ) && !c.kindOf( ReflectionKind.SomeModule ) ) );
			intermediateCleanups.push( () => model.children = prevPageChildren );
		} else if( model instanceof DeclarationReflection ){
			intermediateCleanups.push( ...treeShakeProject( project, this._getModuleOfDeclaration( model ) ) );
		}
	}

	/**
	 * Restore the alteration of pages modified via {@link _hookOnRenderPageStart}.
	 */
	private _hookOnRenderPageEnd(){
		assert( this._renderPageCleanup );
		this._renderPageCleanup();
		this._renderPageCleanup = undefined;
	}
}
