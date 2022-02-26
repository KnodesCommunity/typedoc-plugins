import { RenderTemplate, RendererEvent, UrlMapping } from 'typedoc';

import { IPluginOptions } from '../options';
import { PageReflection } from '../reflections';
import { RenderPageLinkProps } from '../theme';

export interface IPageTreeBuilder {
	renderPageLink: RenderTemplate<RenderPageLinkProps>;
	/**
	 * Alter the {@link event} to add pages & entries for the pages passed via {@link options}.
	 *
	 * @param event - The render event to affect.
	 * @param options - The plugin options.
	 */
	appendToProject( renderEvent: RendererEvent, options: IPluginOptions ): void;
	get mappings(): Array<UrlMapping<PageReflection>>;
}
