import { Application, DefaultTheme } from 'typedoc';

import type { PagesPlugin } from '../plugin';
import { isPagesPluginTheme } from '../theme';
import { FallbackPageTreeBuilder } from './fallback-page-tree-builder';
import { IPageTreeBuilder } from './types';

export * from './types';
export const getPageTreeBuilder = ( application: Application, plugin: PagesPlugin ): IPageTreeBuilder => {
	const theme = application.renderer.theme;
	if( !theme ){
		throw new Error( 'Missing theme' );
	}
	if( !isPagesPluginTheme( theme ) ){
		if( theme instanceof DefaultTheme ){
			return new FallbackPageTreeBuilder( theme, application.options.getValue( 'theme' ), plugin );
		} else {
			throw new Error( 'Unhandled non-default theme' );
		}
	} else {
		throw new Error();
	}
};
