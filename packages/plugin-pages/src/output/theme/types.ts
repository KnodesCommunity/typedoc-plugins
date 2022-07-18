import { RenderTemplate, RendererEvent, Theme } from 'typedoc';

import { PageReflection } from '../../models/reflections';

export type RenderPageLinkProps = {page: PageReflection; label?: string};
export interface IPagesPluginThemeMethods {
	renderPageLink: RenderTemplate<RenderPageLinkProps>;
}
export interface IPagesPluginTheme extends Theme {
	pagesPlugin( event: RendererEvent ): IPagesPluginThemeMethods;
}

export const isPagesPluginTheme = ( theme: Theme ): theme is IPagesPluginTheme => 'pagesPlugin' in theme;
