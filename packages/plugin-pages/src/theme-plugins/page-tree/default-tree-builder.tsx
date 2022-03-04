import assert from 'assert';
import { copyFileSync } from 'fs';
import { join } from 'path';

import { DeclarationReflection, DefaultTheme, JSX, PageEvent, ProjectReflection, Reflection, ReflectionKind, RenderTemplate, RendererEvent, UrlMapping } from 'typedoc';

import type { PagesPlugin } from '../../plugin';
import { ANodeReflection, MenuReflection, NodeReflection, PageReflection } from '../../reflections';
import { RenderPageLinkProps } from '../../theme';
import { APageTreeBuilder } from './a-page-tree-builder';
import { getNodePath, traverseDeep } from './utils';

const CSS_FILE_NAME = 'assets/pages.css';
export class DefaultTreeBuilder extends APageTreeBuilder {
	public constructor( protected override readonly theme: DefaultTheme, plugin: PagesPlugin ){
		super( theme, plugin );
		const { renderer } = theme.application;
		// Add stylesheet
		renderer.on( RendererEvent.END, this._onRenderEnd.bind( this ) );
		renderer.hooks.on( 'head.end', context => <link rel="stylesheet" href={context.relativeURL( CSS_FILE_NAME )} /> );
	}

	public renderPageLink: RenderTemplate<RenderPageLinkProps> = ( { mapping, label } ): JSX.Element =>
		<a href={this.theme.markedPlugin.getRelativeUrl( mapping.url )}>{label ?? mapping.model.originalName}</a>;

	/**
	 * In fallback mode, all page nodes are identified as {@link ReflectionKind.Namespace}.
	 *
	 * @returns the namespace reflection kind.
	 */
	protected override getReflectionKind(): ReflectionKind {
		return ReflectionKind.Namespace;
	}

	/**
	 * Generate mappings (pages) from the given node reflections.
	 *
	 * @param event - The render event to affect.
	 * @param reflections - The list of node reflections (pages & menu).
	 * @returns the list of mappings to create.
	 */
	protected generateMappings( event: RendererEvent, reflections: readonly NodeReflection[] ): Array<UrlMapping<PageReflection>> {
		const modulePagesReflections: PageReflection[] = [];
		const moduleNodeReflections: NodeReflection[] = [];
		const pagesReflections: PageReflection[] = [];
		const nodeReflections: NodeReflection[] = [];
		const harvestReflection = ( reflection: Reflection ) => {
			if( reflection instanceof ANodeReflection && !( reflection.module instanceof ProjectReflection ) && reflection.isModuleRoot ){
				if( reflection instanceof PageReflection ){
					modulePagesReflections.push( reflection );
					moduleNodeReflections.push( reflection );
				} else if( reflection instanceof MenuReflection ){
					moduleNodeReflections.push( reflection );
				}
				return;
			}
			if( reflection instanceof PageReflection ){
				pagesReflections.push( reflection );
				nodeReflections.push( reflection );
			} else if( reflection instanceof MenuReflection ){
				nodeReflections.push( reflection );
			}
		};
		traverseDeep( reflections, r => harvestReflection( r ) );
		moduleNodeReflections.forEach( r => event.project.removeReflection( r ) );
		traverseDeep( nodeReflections, r => event.project.registerReflection( r ) );
		nodeReflections.concat( moduleNodeReflections ).forEach( r => delete r.children );
		modulePagesReflections.forEach( mpr => {
			// Remove self from tree
			assert( mpr.parent.parent instanceof ProjectReflection || mpr.parent.parent instanceof DeclarationReflection );
			mpr.children?.forEach( c => c.parent = mpr.parent );

			// Get mapping to modify
			const moduleMapping = event.urls?.find( u => u.model === mpr.module );
			assert( moduleMapping );
			mpr.url = moduleMapping.url;
			// Prepend page to module index
			const baseTemplate = moduleMapping.template;
			moduleMapping.template = props => {
				const fakeProject = new ProjectReflection( props.name );
				fakeProject.readme = mpr.content;
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
			this.plugin.logger.verbose( `Adding page ${getNodePath( pr )} as URL ${pr.url}` );
			return new UrlMapping( pr.url, pr, this._renderPage );
		} );
	}

	/**
	 * Register the {@link nodeReflection} into the correct reflection (project or module).
	 *
	 * @param nodeReflection - The node reflection.
	 */
	protected addNodeToProjectAsChild( nodeReflection: NodeReflection ): void {
		nodeReflection.cssClasses = [
			'pages-entry',
			nodeReflection instanceof PageReflection ? 'pages-entry-page' : 'pages-entry-menu',
			`pages-entry-depth-${nodeReflection.depth}`,
			...( nodeReflection.cssClasses?.split( ' ' ) ?? [] ),
		].join( ' ' );
		const moduleChildren = nodeReflection.module.children ?? [];
		if( nodeReflection.module === nodeReflection.project ){
			const lastPageIndexRev = moduleChildren.slice().reverse().findIndex( r => r instanceof ANodeReflection );
			const lastPageIndex = lastPageIndexRev === -1 ? 0 : moduleChildren.length - lastPageIndexRev;
			nodeReflection.module.children = [
				...moduleChildren.slice( 0, lastPageIndex ),
				nodeReflection,
				...moduleChildren.slice( lastPageIndex ),
			];
		} else {
			nodeReflection.module.children = [
				...moduleChildren,
				nodeReflection,
			];
		}
	}

	private readonly _renderPage: RenderTemplate<PageEvent<PageReflection>> = props => {
		( props.model as any ).readme = props.model.content;
		return this.theme.indexTemplate( props as PageEvent<any> );
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
}
