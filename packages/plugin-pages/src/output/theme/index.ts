import assert from 'assert';

import { once } from 'lodash';
import { DefaultTheme, RendererEvent } from 'typedoc';

import { DefaultPagesRenderer } from './default-pages-renderer';
import { IPagesPluginThemeMethods, isPagesPluginTheme } from './types';
import type { PagesPlugin } from '../../plugin';

export const getPagesPluginThemeMethods = once( ( plugin: PagesPlugin, event: RendererEvent ): IPagesPluginThemeMethods => {
	const theme = plugin.application.renderer.theme;
	assert( theme, 'Missing theme' );
	if( theme instanceof DefaultTheme ){
		return new DefaultPagesRenderer( plugin, event );
	} else if( isPagesPluginTheme( theme ) ){
		return theme.pagesPlugin( event );
	} else {
		assert.fail( 'Unhandled theme not compatible nor extending the default theme.' );
	}
} );
export { IPagesPluginTheme, RenderPageLinkProps, IPagesPluginThemeMethods } from './types';
