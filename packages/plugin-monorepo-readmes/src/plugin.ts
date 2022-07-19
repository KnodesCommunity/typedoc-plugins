import assert from 'assert';
import { readFileSync } from 'fs';

import { Application, DeclarationReflection, DefaultTheme, JSX, MinimalSourceFile, PageEvent, ProjectReflection, ReflectionKind, RendererEvent } from 'typedoc';

import { ABasePlugin, CurrentPageMemo, EventsExtra, reflectionSourceUtils } from '@knodes/typedoc-pluginutils';

import { findReadmeFile } from './find-readme-file';
import { buildOptions } from './options';
import { isMonorepoReadmesPluginTheme } from './output/theme';

export class MonorepoReadmePlugin extends ABasePlugin {
	public readonly pluginOptions = buildOptions( this );
	private readonly _currentPageMemo = CurrentPageMemo.for( this );
	public constructor( application: Application ){
		super( application, __filename );
	}

	/**
	 * This method is called after the plugin has been instanciated.
	 *
	 * @see {@link import('@knodes/typedoc-pluginutils').autoload}.
	 */
	public initialize(): void {
		this.application.renderer.on( RendererEvent.BEGIN, () => {
			const { theme } = this.application.renderer;
			assert( theme );
			if( theme instanceof DefaultTheme && !isMonorepoReadmesPluginTheme( theme ) ){
				this.application.renderer.on( PageEvent.BEGIN, ( pageEvent: PageEvent ) => {
					if( pageEvent.model instanceof DeclarationReflection && pageEvent.model.kindOf( ReflectionKind.Module ) ) {
						this._modifyModuleIndexPage( theme, pageEvent as PageEvent<DeclarationReflection> );
					}
				}, null, -1 ); // priority is set to be ran after @knodes/typedoc-plugin-pages
			} else {
				this.logger.warn( 'This plugin is loaded, but you are using a theme that explicitly handles readmes by itself. You probably don\'t need this plugin.' );
			}
		} );
		EventsExtra.for( this.application )
			.beforeOptionsFreeze( () => {
				const strategy = this.application.options.getValue( 'entryPointStrategy' );
				if( strategy !== 'packages' ){
					this.logger.warn( `This plugin is loaded, but the entry point strategy is ${strategy}, not "packages". You probably don't need this plugin.` );
				}
			} );
	}

	/**
	 * Modify the template of the module to prepend the README.
	 *
	 * @param theme - The theme used.
	 * @param pageEvent - The module URL mapping to modify
	 */
	private _modifyModuleIndexPage( theme: DefaultTheme, pageEvent: PageEvent<DeclarationReflection> ){
		const readme = findReadmeFile( this.pluginOptions.getValue().rootFiles, pageEvent, this.pluginOptions.getValue().readme );
		if( !readme ){
			return;
		}
		const { absolute: absReadme } = readme;
		const source = reflectionSourceUtils.createSourceReference( this, absReadme );
		pageEvent.model.sources = [
			source,
			...( pageEvent.model.sources ?? [] ),
		];
		this.logger.verbose( `Setting readme of ${pageEvent.model.name} as ${this.relativeToRoot( absReadme )}` );
		const baseTemplate = pageEvent.template;
		pageEvent.template = props => {
			const fakeProject = new ProjectReflection( props.name );
			fakeProject.sources = [
				source,
			];
			const fakePageEvent = new PageEvent<ProjectReflection>( props.name );
			fakeProject.readme = this.application.converter.parseRawComment( new MinimalSourceFile( readFileSync( absReadme, 'utf-8' ), absReadme ) ).summary;
			fakePageEvent.filename = props.filename;
			fakePageEvent.project = props.project;
			fakePageEvent.url = props.url;
			fakePageEvent.model = fakeProject;
			const readmeTpl = this._currentPageMemo.fakeWrapPage( fakePageEvent, () => theme.indexTemplate( fakePageEvent ) );
			const base = baseTemplate( props );
			return JSX.createElement( JSX.Fragment, null, ...[
				readmeTpl,
				JSX.createElement( 'hr', null ),
				base,
			] );
		};
	}
}
