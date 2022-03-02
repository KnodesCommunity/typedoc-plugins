import { RenderTemplate, Theme } from 'typedoc';

import { ICodeBlock } from './types';

export interface ICodeBlocksPluginThemeMethods {
	renderCodeBlock: RenderTemplate<ICodeBlock>;
}
export interface ICodeBlocksPluginTheme extends Theme {
	codeBlocksPlugin: ICodeBlocksPluginThemeMethods;
}

export const isCodeBlocksPluginTheme = ( theme: Theme ): theme is ICodeBlocksPluginTheme => 'codeBlocksPlugin' in theme;
