import { once } from 'lodash';
import { DefaultTheme, RendererEvent } from 'typedoc';

import type { PagesPlugin } from '../../plugin';
import { DefaultPagesRenderer } from './default-pages-renderer';
import { IPagesPluginThemeMethods, isPagesPluginTheme } from './types';

export const getPagesPluginThemeMethods = once( ( plugin: PagesPlugin, event: RendererEvent ): IPagesPluginThemeMethods => {
	const theme = plugin.application.renderer.theme;
	if( !theme ){
		throw new Error( 'Missing theme' );
	}
	if( !isPagesPluginTheme( theme ) ){
		if( theme instanceof DefaultTheme ){
			return new DefaultPagesRenderer( plugin, event );
		} else {
			throw new Error( 'Unhandled theme not compatible nor extending the default theme.' );
		}
	} else {
		return theme.pagesPlugin( event );
	}
} );
export { IPagesPluginTheme, RenderPageLinkProps, IPagesPluginThemeMethods } from './types';
