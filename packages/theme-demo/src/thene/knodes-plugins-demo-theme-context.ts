import { DefaultThemeRenderContext, Options } from 'typedoc';

import type { KnodesPluginsDemoTheme } from './knodes-plugins-demo-theme';
import { navigation } from './partials/navigation';
import { renderPageLink } from './partials/plugin-pages/page-link';
import { pagesNavigation } from './partials/plugin-pages/pages-navigation';

export class KnodesPluginsDemoThemeContext extends DefaultThemeRenderContext {
	public pagesPlugin = {
		pagesNavigation: pagesNavigation( this ),
		renderPageLink: renderPageLink( this ),
	};

	// public codeBlocksPlugin: ICodeBlocksPluginThemeMethods = {};

	public constructor( theme: KnodesPluginsDemoTheme, options: Options ) {
		super( theme, options );

		this.navigation = navigation( this );
	}
}
