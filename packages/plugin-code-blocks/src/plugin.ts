import { Application, RendererEvent } from 'typedoc';

import { ABasePlugin } from '@knodes/typedoc-pluginutils';

import { bindFormatReflectionComments } from './converter';
import { buildOptions } from './options';
import { ICodeBlocksPluginThemeMethods, getCodeBlocksThemeMethods } from './output';
import { bindMarkdownCodeBlocks } from './output/markdown-code-blocks';

/**
 * Pages plugin for integrating your own pages into documentation output
 */
export class CodeBlockPlugin extends ABasePlugin {
	public readonly pluginOptions = buildOptions( this );
	private _themeMethods?: ICodeBlocksPluginThemeMethods;

	public constructor( application: Application ){
		super( application, __filename );
	}

	/**
	 * This method is called after the plugin has been instanciated.
	 *
	 * @see {@link import('@knodes/typedoc-pluginutils').autoload}.
	 */
	public initialize(): void {
		this.application.renderer.on( RendererEvent.BEGIN, this._onRendererBegin.bind( this ), null, 1 );
		bindFormatReflectionComments( this );
	}

	/**
	 * Event callback executed once on {@link RendererEvent.BEGIN}.
	 *
	 * @param event - The Typedoc renderer event.
	 */
	private _onRendererBegin( event: RendererEvent ){
		this._themeMethods = getCodeBlocksThemeMethods( this, event );
		bindMarkdownCodeBlocks( this, this._themeMethods );
	}
}
