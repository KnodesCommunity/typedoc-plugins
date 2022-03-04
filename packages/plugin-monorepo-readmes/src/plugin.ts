import assert from 'assert';
import { readFileSync, readdirSync } from 'fs';
import { dirname, resolve } from 'path';

import { sync as pkgUpSync } from 'pkg-up';
import { Application, DeclarationReflection, DefaultTheme, JSX, PageEvent, ProjectReflection, ReflectionKind, RendererEvent, SourceFile, UrlMapping } from 'typedoc';

import { ABasePlugin } from '@knodes/typedoc-pluginutils';

export class MonorepoReadmePlugin extends ABasePlugin {
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
			assert( event.urls );
			const theme = this.application.renderer.theme;
			const modulesUrls = event.urls.filter( ( u ): u is UrlMapping<DeclarationReflection> => u.model instanceof DeclarationReflection && u.model.kindOf( ReflectionKind.Module ) );
			modulesUrls.forEach( u => {
				const src = u.model.sources?.[0].fileName;
				if( !src ){
					return;
				}
				const pkgFile = pkgUpSync( { cwd: dirname( src ) } );
				if( !pkgFile ){
					return;
				}
				const pkgDir = dirname( pkgFile );
				const readmeFile = readdirSync( pkgDir ).find( f => f.toLowerCase() === 'readme.md' );
				if( !readmeFile ){
					return;
				}
				const absReadmeFile = resolve( pkgDir, readmeFile );
				const source = { character: 1, line: 1, fileName: readmeFile, file: new SourceFile( absReadmeFile ) };
				u.model.sources = [
					...( u.model.sources ?? [] ),
					source,
				];
				this.logger.info( `Setting readme of ${u.model.name} as ${this.relativeToRoot( readmeFile )}` );
				const baseTemplate = u.template;
				u.template = props => {
					const fakeProject = new ProjectReflection( props.name );
					fakeProject.readme = readFileSync( absReadmeFile, 'utf-8' );
					fakeProject.sources = [
						source,
					];
					const fakePageEvent = new PageEvent<ProjectReflection>( props.name );
					fakePageEvent.filename = props.filename;
					fakePageEvent.project = props.project;
					fakePageEvent.url = props.url;
					fakePageEvent.model = fakeProject;
					const readme = theme.indexTemplate( fakePageEvent );
					const base = baseTemplate( props );
					return JSX.createElement( JSX.Fragment, null, ...[
						readme,
						JSX.createElement( 'hr', null ),
						base,
					] );
				};
			} );
		}, null, -1000 );
	}
}
