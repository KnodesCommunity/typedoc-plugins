import { RenderTemplate, Theme } from 'typedoc';

export type FoldableMode = 'foldable' | 'folded' | null;
export interface ICodeBlock {
	sourceFile: string;
	asFile: string;
	mode: FoldableMode;
	content: string;
	url?: string;
}
export interface ICodeBlocksPluginThemeMethods {
	renderCodeBlock: RenderTemplate<ICodeBlock>;
}
export interface ICodeBlocksPluginTheme extends Theme {
	codeBlocksPlugin: ICodeBlocksPluginThemeMethods;
}

export const isCodeBlocksPluginTheme = ( theme: Theme ): theme is ICodeBlocksPluginTheme => 'codeBlocksPlugin' in theme;
