import { DefaultTheme, RendererEvent } from 'typedoc';

import type { CodeBlockPlugin } from '../../plugin';
import { DefaultCodeBlockRenderer } from './default-code-block-renderer';
import { ICodeBlocksPluginThemeMethods, isCodeBlocksPluginTheme } from './types';

export const getCodeBlocksThemeMethods = ( plugin: CodeBlockPlugin, event: RendererEvent ): ICodeBlocksPluginThemeMethods => {
	const theme = plugin.application.renderer.theme;
	if( !theme ){
		throw new Error( 'Missing theme' );
	}
	if( !isCodeBlocksPluginTheme( theme ) ){
		if( theme instanceof DefaultTheme ){
			return new DefaultCodeBlockRenderer( plugin );
		} else {
			throw new Error( 'Unhandled theme not compatible nor extending the default theme.' );
		}
	} else {
		return theme.codeBlocksPlugin( event );
	}
};
export { ICodeBlocksPluginTheme, ICodeBlocksPluginThemeMethods } from './types';
