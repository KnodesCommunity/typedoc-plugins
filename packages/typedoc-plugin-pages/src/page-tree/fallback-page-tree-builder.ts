import { times, uniq } from 'lodash';
import { DefaultTheme, PageEvent, Reflection, ReflectionKind, RenderTemplate, UrlMapping } from 'typedoc';

import { PageNode } from '../options';
import type { PagesPlugin } from '../plugin';
import { MenuReflection, NodeReflection, PageReflection } from '../reflections';
import { RenderPageLinkProps } from '../theme';
import { APageTreeBuilder, IDeepParams } from './a-page-tree-builder';
import { doRenderTemplate } from './default-render-link';
import { traverseDeep } from './utils';

export class FallbackPageTreeBuilder extends APageTreeBuilder {
	public constructor( protected override readonly theme: DefaultTheme, themeName: string, plugin: PagesPlugin ){
		super( theme, plugin );
		plugin.logger.warn( `The current theme "${themeName}" is not compatible with the plugin. Using fallback pages tree builder.` );
	}

	public renderPageLink: RenderTemplate<RenderPageLinkProps> = props =>
		doRenderTemplate( { ...props, context: this.theme.getRenderContext( props.event ) } );

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
	 * Generate the node (menu item, page) title.
	 *
	 * @param deepParams - The deep params.
	 * @param node - The node.
	 * @returns the node title.
	 */
	protected getNodeTitle( deepParams: IDeepParams, node: PageNode ): string {
		return `${times( deepParams.depth, () => '⇒' ).join( ' ' )  } ${node.title}`;
	}

	/**
	 * Register the {@link nodeReflection} into the correct reflection (project or module).
	 *
	 * @param deepParams - The deep params.
	 * @param nodeReflection - The node reflection.
	 */
	protected addNodeToProjectAsChild( deepParams: IDeepParams, nodeReflection: NodeReflection ): void {
		deepParams.module.children = uniq( [
			nodeReflection,
			...( deepParams.module.children ?? [] ),
		] );
	}

	private readonly _renderPage: RenderTemplate<PageEvent<PageReflection>> = props => {
		( props.model as any ).readme = props.model.content;
		return this.theme.indexTemplate( props as PageEvent<any> );
	};
}
