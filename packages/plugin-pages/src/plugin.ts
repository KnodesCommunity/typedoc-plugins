import { Application, Context, Converter, Reflection, RendererEvent } from 'typedoc';

import { ABasePlugin, EventsExtra, ReflectionCommentReplacer } from '@knodes/typedoc-pluginutils';

import { PageTreeBuilder } from './converter/page-tree';
import { ANodeReflection } from './models/reflections';
import { buildOptions } from './options';
import { IPagesPluginThemeMethods, bindReplaceMarkdown, getPagesPluginThemeMethods } from './output';

export class PagesPlugin extends ABasePlugin {
	public readonly pluginOptions = buildOptions( this );
	private readonly _reflectionCommentReplacer = new ReflectionCommentReplacer( this );
	private _themeMethods?: IPagesPluginThemeMethods;
	public constructor( application: Application ){
		super( application, __filename );
	}

	/**
	 * This method is called after the plugin has been instantiated.
	 */
	public override initialize(){
		this.application.converter.on( Converter.EVENT_RESOLVE_BEGIN, this._onConverterResolveBegin.bind( this ) );
		this.application.renderer.on( RendererEvent.BEGIN, this._onRendererBegin.bind( this ), null, 1 );
		EventsExtra.for( this.application )
			.beforeOptionsFreeze( () => {
				if( this.pluginOptions.getValue().enablePageLinks ){
					this._reflectionCommentReplacer.registerInlineTag( '@page' ); // Preserve {@page} tags for being replaced in markdown
				}
			} );
	}

	/**
	 * Event callback executed once on {@link Converter.EVENT_RESOLVE_BEGIN}.
	 * It registers node reflections in the project.
	 *
	 * @param context - The Typedoc context.
	 */
	private _onConverterResolveBegin( context: Context ) {
		const rootMenu =  new PageTreeBuilder( this ).buildPagesTree( context.project, this.pluginOptions.getValue() );
		const registerNodes = ( ref: Reflection ) => {
			if( ref instanceof ANodeReflection ){
				context.project.registerReflection( ref );
			}
			ref.traverse( registerNodes );
		};
		rootMenu.traverse( registerNodes );
	}

	/**
	 * Event callback executed once on {@link RendererEvent.BEGIN}.
	 * It setups @page tags replacement in markdown.
	 *
	 * @param event - The Typedoc renderer event.
	 */
	private _onRendererBegin( event: RendererEvent ){
		this._themeMethods = getPagesPluginThemeMethods( this, event );
		if( this.pluginOptions.getValue().enablePageLinks ){
			bindReplaceMarkdown( this, this._themeMethods, event );
		}
	}
}
