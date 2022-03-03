import { Application, DefaultTheme } from 'typedoc';

import type { PagesPlugin } from '../plugin';
import { isPagesPluginTheme } from '../theme';
import { DefaultTreeBuilder } from './page-tree/default-tree-builder';
import { IPageTreeBuilder } from './page-tree/types';
import { DefaultPagesJavascriptIndexPlugin } from './search';

export * from './page-tree/types';
export const initThemePlugins = ( application: Application, plugin: PagesPlugin ): IPageTreeBuilder => {
	const theme = application.renderer.theme;
	if( !theme ){
		throw new Error( 'Missing theme' );
	}
	if( !isPagesPluginTheme( theme ) ){
		if( theme instanceof DefaultTheme ){
			new DefaultPagesJavascriptIndexPlugin( plugin ).initialize();
			return new DefaultTreeBuilder( theme, plugin );
		} else {
			throw new Error( 'Unhandled theme not compatible nor extending the default theme.' );
		}
	} else {
		throw new Error( 'Not implemented' );
	}
};
