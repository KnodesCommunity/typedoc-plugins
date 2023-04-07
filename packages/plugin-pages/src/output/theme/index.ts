import assert from 'assert';

import { once } from 'lodash';
import { DefaultTheme, RendererEvent } from 'typedoc';

import { DefaultPagesRenderer } from './default-pages-renderer';
import { IPagesPluginThemeMethods, isPagesPluginTheme } from './types';
import type { PagesPlugin } from '../../plugin';

export const getPagesPluginThemeMethods = once( ( plugin: PagesPlugin, event: RendererEvent ): IPagesPluginThemeMethods => {
	const theme = plugin.application.renderer.theme;
	assert( theme, 'Missing theme' );
	if( !isPagesPluginTheme( theme ) ){
		assert( theme instanceof DefaultTheme, 'Unhandled theme not compatible nor extending the default theme.' );
		return new DefaultPagesRenderer( plugin, event );
	} else {
		return theme.pagesPlugin( event );
	}
} );
export { IPagesPluginTheme, RenderPageLinkProps, IPagesPluginThemeMethods } from './types';
