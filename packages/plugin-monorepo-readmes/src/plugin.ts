import assert from 'assert';
import { readFileSync } from 'fs';

import { Application, DeclarationReflection, DefaultTheme, JSX, LogLevel, PageEvent, ProjectReflection, ReflectionKind, RendererEvent, SourceFile, UrlMapping } from 'typedoc';

import { ABasePlugin, EventsExtra } from '@knodes/typedoc-pluginutils';

import { findReadmeFile } from './find-readme-file';
import { buildOptions } from './options';

export class MonorepoReadmePlugin extends ABasePlugin {
	public readonly pluginOptions = buildOptions( this );
	public constructor( application: Application ){
		super( application, __filename );
	}

	/**
	 * This method is called after the plugin has been instanciated.
	 *
	 * @see {@link import('@knodes/typedoc-pluginutils').autoload}.
	 */
	public initialize(): void {
		this.application.renderer.on( RendererEvent.BEGIN, ( event: RendererEvent ) => {
			assert( this.application.renderer.theme );
			assert( this.application.renderer.theme instanceof DefaultTheme );
			const theme = this.application.renderer.theme;
			assert( event.urls );
			const modulesUrls = event.urls.filter( ( u ): u is UrlMapping<DeclarationReflection> => u.model instanceof DeclarationReflection && u.model.kindOf( ReflectionKind.Module ) );
			modulesUrls.forEach( u => this._modifyModuleIndexPage( theme, u ) );
		}, null, -1000 ); // priority is set to be ran before @knodes/typedoc-plugin-pages
		EventsExtra.for( this.application )
			.onSetOption( `${this.optionsPrefix}:logLevel`, v => {
				this.logger.level = v as LogLevel;
			} );
	}

	/**
	 * Modify the template of the module to prepend the README.
	 *
	 * @param theme - The theme used.
	 * @param moduleMapping - The module URL mapping to modify
	 */
	private _modifyModuleIndexPage( theme: DefaultTheme, moduleMapping: UrlMapping<DeclarationReflection> ){
		const readme = findReadmeFile( this.pluginOptions.getValue().rootFiles, moduleMapping, this.pluginOptions.getValue().readme );
		if( !readme ){
			return;
		}
		const { absolute: absReadme, relative: relReadme } = readme;
		const source = { character: 1, line: 1, fileName: relReadme, file: new SourceFile( absReadme ) };
		moduleMapping.model.sources = [
			...( moduleMapping.model.sources ?? [] ),
			source,
		];
		this.logger.info( `Setting readme of ${moduleMapping.model.name} as ${this.relativeToRoot( absReadme )}` );
		const baseTemplate = moduleMapping.template;
		moduleMapping.template = props => {
			const fakeProject = new ProjectReflection( props.name );
			fakeProject.readme = readFileSync( absReadme, 'utf-8' );
			fakeProject.sources = [
				source,
			];
			const fakePageEvent = new PageEvent<ProjectReflection>( props.name );
			fakePageEvent.filename = props.filename;
			fakePageEvent.project = props.project;
			fakePageEvent.url = props.url;
			fakePageEvent.model = fakeProject;
			const readmeTpl = theme.indexTemplate( fakePageEvent );
			const base = baseTemplate( props );
			return JSX.createElement( JSX.Fragment, null, ...[
				readmeTpl,
				JSX.createElement( 'hr', null ),
				base,
			] );
		};
	}
}
