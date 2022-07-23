import { DefaultTheme, Renderer, RendererEvent } from 'typedoc';

import type { ICodeBlocksPluginTheme, ICodeBlocksPluginThemeMethods } from '@knodes/typedoc-plugin-code-blocks';
import type { IReadmePluginTheme } from '@knodes/typedoc-plugin-monorepo-readmes';
import type { IPagesPluginTheme, IPagesPluginThemeMethods } from '@knodes/typedoc-plugin-pages';

import { KnodesPluginsDemoThemeContext } from './knodes-plugins-demo-theme-context';

export class KnodesPluginsDemoTheme extends DefaultTheme implements IPagesPluginTheme, ICodeBlocksPluginTheme, IReadmePluginTheme {
	public readonly monorepoReadmesPlugin = true as const;
	private _contextCache?: KnodesPluginsDemoThemeContext;

	public constructor( renderer: Renderer ) {
		super( renderer );
	}

	/**
	 * Return the plugin methods.
	 * This method is called when `@knodes/typedoc-plugin=pages` will start rendering.
	 * You might do some initialization here, like copying specific assets, or post-processing the pages tree.
	 *
	 * @param _event - The renderer event.
	 * @returns the plugin rendering methods for this theme.
	 */
	public pagesPlugin( _event: RendererEvent ): IPagesPluginThemeMethods {
		return this.getRenderContext().pagesPlugin;
	}

	/**
	 * Return the plugin methods.
	 *
	 * @param _event - The renderer event.
	 * @returns the plugin rendering methods for this theme.
	 */
	public codeBlocksPlugin( _event: RendererEvent ): ICodeBlocksPluginThemeMethods {
		throw new Error( 'Method not implemented.' );
		return {} as any;
	}

	/**
	 * Obtain the stored instance of context.
	 *
	 * @returns the theme context.
	 */
	public override getRenderContext(): KnodesPluginsDemoThemeContext {
		this._contextCache = this._contextCache ??
			new KnodesPluginsDemoThemeContext( this, this.application.options )	;

		return this._contextCache;
	}
}

