import { PageEvent, RenderTemplate, Theme, UrlMapping } from 'typedoc';

import { PageReflection } from './reflections';
export type RenderPageLinkProps = {mapping: UrlMapping<PageReflection>; label?: string; event: PageEvent};
export interface IPagesPluginThemeMethods{
	renderPage: RenderTemplate<PageEvent<PageReflection>>;
	renderPageLink: RenderTemplate<RenderPageLinkProps>;
}
export interface IPagesPluginTheme extends Theme {
	pagesPlugin: IPagesPluginThemeMethods;
}

export const isPagesPluginTheme = ( theme: Theme ): theme is IPagesPluginTheme => 'pagesPlugin' in theme;
