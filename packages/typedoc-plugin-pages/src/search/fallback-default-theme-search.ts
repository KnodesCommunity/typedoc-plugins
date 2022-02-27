import assert from 'assert';

import { isString } from 'lodash';

import {} from 'lunr';
import { DeclarationReflection, ProjectReflection, ReflectionKind, RendererEvent } from 'typedoc';
import type { JavascriptIndexPlugin as JavascriptIndexPlugin_ } from 'typedoc/dist/lib/output/plugins';

import type { PagesPlugin } from '../plugin';
import { ANodeReflection } from '../reflections/a-node-reflection';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Force expose private/protected
// @ts-ignore
interface JavascriptIndexPlugin extends JavascriptIndexPlugin_ {
	onRendererBegin( event: RendererEvent ): void;
}
const PLUGIN_NAME = 'javascript-index';

export class FallbackDefaultThemeSearch {
	private readonly _defaultSearch: JavascriptIndexPlugin;
	public constructor( private readonly _plugin: PagesPlugin ) {
		this._defaultSearch = this._plugin.application.renderer.getComponent( PLUGIN_NAME ) as JavascriptIndexPlugin;
		assert( this._defaultSearch );
	}

	/**
	 * This method is called after the plugin has been instanciated.
	 */
	public initialize(){
		assert( this._defaultSearch.onRendererBegin );
		this._plugin.application.renderer.off( RendererEvent.BEGIN, this._defaultSearch.onRendererBegin );
		this._plugin.application.renderer.on( RendererEvent.BEGIN, this._onRenderBegin.bind( this ) );
	}

	/**
	 * Generate fake declarations for pages to be added in the lunr search index.
	 *
	 * @param project - The project reflection.
	 * @returns the list of fake declaration reflections.
	 */
	private _getPages( project: ProjectReflection ){
		return this._plugin.pageTreeBuilder().mappings
			.map( m => m.model )
			.map( m => {
				const name = [
					'Page:',
					m.module !== project ? `${m.module.name} ⇒` : undefined,
					m.name,
				].filter( isString ).join( ' ' );
				const dec = new DeclarationReflection( name, ReflectionKind.Method );
				dec.comment = m.comment;
				dec.url = m.url;
				dec.cssClasses = 'tsd-kind-method tsd-parent-kind-interface tsd-is-inherited tsd-is-external pages-entry';
				return dec;
			} );
	}

	/**
	 * Hook over rendering start to generate the search index. It calls the default {@link JavascriptIndexPlugin} with custom declarations for pages.
	 *
	 * @param event - The renderer event.
	 */
	private _onRenderBegin( event: RendererEvent ){
		const projectReflection = new ProjectReflection( event.project.name );
		Object.assign( projectReflection, event.project );
		projectReflection.getReflectionsByKind = kind => [
			...this._getPages( event.project ),
			...event.project.getReflectionsByKind( kind )
				.filter( r => !( r instanceof ANodeReflection ) ),
		];
		const innerEvent = new RendererEvent( event.name, event.outputDirectory, projectReflection );
		this._defaultSearch.onRendererBegin( innerEvent );
	}
}
