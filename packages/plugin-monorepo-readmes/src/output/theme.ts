import { Theme } from 'typedoc';

export interface IReadmePluginTheme extends Theme {
	monorepoReadmesPlugin: boolean;
}

export const isMonorepoReadmesPluginTheme = ( theme: Theme ): theme is IReadmePluginTheme => 'monorepoReadmesPlugin' in theme && ( theme as any ).monorepoReadmesPlugin === true;
