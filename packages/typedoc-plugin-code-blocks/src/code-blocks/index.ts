import { Application, DefaultTheme } from 'typedoc';

import type { CodeBlockPlugin } from '../plugin';
import { ICodeBlocksPluginThemeMethods, isCodeBlocksPluginTheme } from '../theme';
import { FallbackCodeBlockRenderer } from './fallback-code-block-renderer';

export const getCodeBlockRenderer = ( application: Application, plugin: CodeBlockPlugin ): ICodeBlocksPluginThemeMethods => {
	const theme = application.renderer.theme;
	if( !theme ){
		throw new Error( 'Missing theme' );
	}
	if( !isCodeBlocksPluginTheme( theme ) ){
		if( theme instanceof DefaultTheme ){
			return new FallbackCodeBlockRenderer( theme, application.options.getValue( 'theme' ), plugin );
		} else {
			throw new Error( 'Unhandled non-default theme' );
		}
	} else {
		throw new Error();
	}
};
