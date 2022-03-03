import { Application, DefaultTheme } from 'typedoc';

import type { CodeBlockPlugin } from '../plugin';
import { ICodeBlocksPluginThemeMethods, isCodeBlocksPluginTheme } from '../theme';
import { DefaultCodeBlockRenderer } from './default-code-block-renderer';

export const getCodeBlockRenderer = ( application: Application, plugin: CodeBlockPlugin ): ICodeBlocksPluginThemeMethods => {
	const theme = application.renderer.theme;
	if( !theme ){
		throw new Error( 'Missing theme' );
	}
	if( !isCodeBlocksPluginTheme( theme ) ){
		if( theme instanceof DefaultTheme ){
			return new DefaultCodeBlockRenderer( theme, plugin );
		} else {
			throw new Error( 'Unhandled theme not compatible nor extending the default theme.' );
		}
	} else {
		throw new Error( 'Not implemented' );
	}
};
