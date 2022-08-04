import assert from 'assert';

import { DefaultTheme, RendererEvent } from 'typedoc';

import type { CodeBlockPlugin } from '../../plugin';
import { DefaultCodeBlockRenderer } from './default-code-block-renderer';
import { ICodeBlocksPluginThemeMethods, isCodeBlocksPluginTheme } from './types';

export const getCodeBlocksThemeMethods = ( plugin: CodeBlockPlugin, event: RendererEvent ): ICodeBlocksPluginThemeMethods => {
	const theme = plugin.application.renderer.theme;
	assert( theme, 'Missing theme' );
	if( !isCodeBlocksPluginTheme( theme ) ){
		assert( theme instanceof DefaultTheme, 'Unhandled theme not compatible nor extending the default theme.' );
		return new DefaultCodeBlockRenderer( plugin );
	} else {
		return theme.codeBlocksPlugin( event );
	}
};
export { ICodeBlocksPluginTheme, ICodeBlocksPluginThemeMethods } from './types';
