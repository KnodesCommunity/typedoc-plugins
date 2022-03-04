import { RenderTemplate, Theme } from 'typedoc';

import { ICodeBlock, IInlineCodeBlock } from './types';

export interface ICodeBlocksPluginThemeMethods {
	renderCodeBlock: RenderTemplate<ICodeBlock>;
	renderInlineCodeBlock: RenderTemplate<IInlineCodeBlock>;
}
export interface ICodeBlocksPluginTheme extends Theme {
	codeBlocksPlugin: ICodeBlocksPluginThemeMethods;
}

export const isCodeBlocksPluginTheme = ( theme: Theme ): theme is ICodeBlocksPluginTheme => 'codeBlocksPlugin' in theme;
