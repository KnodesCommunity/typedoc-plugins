import { uniq } from 'lodash';
import { DefaultTheme, PageEvent, Reflection, ReflectionKind, RenderTemplate, UrlMapping } from 'typedoc';

import type { PagesPlugin } from '../plugin';
import { MenuReflection, NodeReflection, PageReflection } from '../reflections';
import { RenderPageLinkProps } from '../theme';
import { APageTreeBuilder } from './a-page-tree-builder';
import { fallbackRenderPageLink } from './fallback-render-page-link';
import { traverseDeep } from './utils';

export class FallbackPageTreeBuilder extends APageTreeBuilder {
	public constructor( protected override readonly theme: DefaultTheme, themeName: string, plugin: PagesPlugin ){
		super( theme, plugin );
		plugin.logger.warn( `The current theme "${themeName}" is not compatible with the plugin. Using fallback pages tree builder.` );
	}

	public renderPageLink: RenderTemplate<RenderPageLinkProps> = props =>
		fallbackRenderPageLink( { ...props, theme: this.theme } );

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
	 * @param reflections - The list of node reflections (pages & menu).
	 * @returns the list of mappings to create.
	 */
	protected generateMappings( reflections: readonly NodeReflection[] ): Array<UrlMapping<PageReflection>> {
		const pagesReflections: PageReflection[] = [];
		const allChildReflection: NodeReflection[] = [];
		const harvestReflection = ( reflection: Reflection ) => {
			if( reflection instanceof PageReflection ){
				pagesReflections.push( reflection );
				allChildReflection.push( reflection );
			} else if( reflection instanceof MenuReflection ){
				allChildReflection.push( reflection );
			}
		};
		traverseDeep( reflections, r => harvestReflection( r ) );
		allChildReflection.forEach( r => delete r.children );
		return pagesReflections.map( r => new UrlMapping( r.url, r, this._renderPage ) );
	}

	/**
	 * Register the {@link nodeReflection} into the correct reflection (project or module).
	 *
	 * @param nodeReflection - The node reflection.
	 */
	protected addNodeToProjectAsChild( nodeReflection: NodeReflection ): void {
		nodeReflection.module.children = uniq( [
			nodeReflection,
			...( nodeReflection.module.children ?? [] ),
		] );
	}

	private readonly _renderPage: RenderTemplate<PageEvent<PageReflection>> = props => {
		( props.model as any ).readme = props.model.content;
		return this.theme.indexTemplate( props as PageEvent<any> );
	};
}
