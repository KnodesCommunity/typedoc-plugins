import assert from 'assert';
import { basename, dirname, relative, resolve } from 'path';

import { camelCase, isString, once } from 'lodash';
import { sync as pkgUpSync } from 'pkg-up';
import { satisfies } from 'semver';
import { PackageJson, ReadonlyDeep, SetRequired } from 'type-fest';
import { Application, Context, Converter, LogLevel, SourceReference, normalizePath } from 'typedoc';

import { EventsExtra } from './events-extra';
import { PluginLogger } from './plugin-logger';
import { miscUtils } from './utils';

type RequiredPackageJson = SetRequired<PackageJson, 'name' | 'version'>
export abstract class ABasePlugin {
	private static readonly _addSourceToProject = once( function( this: ABasePlugin, context: Context ){
		const packagePlugin: undefined | Partial<Readonly<{readmeFile: string; packageFile: string}>>  = context.converter.getComponent( 'package' ) as any;
		const errMsg = 'It is used to complete README & package sources for better tracking of markdown issues.';
		if( !packagePlugin ){
			this.logger.warn( `Missing \`package\` plugin. ${errMsg}` );
			return;
		}
		if( !( 'readmeFile' in packagePlugin && isString( packagePlugin.readmeFile ) ) ){
			this.logger.warn( `Missing \`readmeFile\` in \`package\` plugin. ${errMsg}` );
			return;
		}

		const extraSources = [
			new SourceReference( packagePlugin.readmeFile, 1, 1 ),
		];
		if( 'packageFile' in packagePlugin && isString( packagePlugin.packageFile ) ){
			extraSources.push( new SourceReference( packagePlugin.packageFile, 1, 1 ) );
		}
		context.project.sources = [
			...extraSources,
			...( context.project.sources ?? [] ),
		];
	} );
	public readonly optionsPrefix: string;
	public readonly package: ReadonlyDeep<RequiredPackageJson>;
	public readonly logger: PluginLogger;
	public get name(): string{
		return `${this.package.name}:${this.constructor.name}`;
	}
	public get rootDir(): string {
		return miscUtils.rootDir( this.application );
	}
	public readonly pluginDir: string;
	/**
	 * Instanciate a new instance of the base plugin. The `package.json` file will be read to obtain the plugin name & the TypeDoc compatible range.
	 * Logs a warning if the current TypeDoc version is not compatible.
	 *
	 * @param application - The application instance.
	 * @param pluginFilename - The actual plugin file name. Used to lookup the `package.json` file.
	 */
	public constructor( public readonly application: Application, pluginFilename: string ){
		const pkgFile = pkgUpSync( { cwd: dirname( pluginFilename ) } );
		if( !pkgFile ){
			throw new Error( 'Could not determine package.json' );
		}
		// eslint-disable-next-line @typescript-eslint/no-var-requires -- Require package.json
		const pkg: ReadonlyDeep<PackageJson> = require( pkgFile );
		assert( pkg.name );
		assert( pkg.version );
		this.pluginDir = dirname( pkgFile );
		this.package = pkg as RequiredPackageJson;

		this.logger = new PluginLogger( application.logger, this );
		this.logger.verbose( `Using plugin version ${pkg.version}` );
		this.optionsPrefix = camelCase( basename( pkg.name ).replace( /^typedoc-/, '' ) );
		EventsExtra.for( this.application )
			.onSetOption( `${this.optionsPrefix}:logLevel`, v => {
				this.logger.level = v as LogLevel;
			} );

		const typedocPeerDep = pkg.peerDependencies?.typedoc ?? pkg.dependencies?.typedoc;
		assert( typedocPeerDep );
		if( !satisfies( Application.VERSION, typedocPeerDep ) ){
			this.logger.warn( `TypeDoc version ${Application.VERSION} does not match the plugin's peer dependency range ${typedocPeerDep}. You might encounter problems.` );
		}
		this.application.converter.on( Converter.EVENT_RESOLVE_BEGIN, ABasePlugin._addSourceToProject.bind( this ) );
	}

	/**
	 * This method is called after the plugin has been instanciated.
	 *
	 * @see {@link import('./autoload').autoload}.
	 */
	public abstract initialize(): void;

	/**
	 * Return the path as a relative path from the {@link rootDir}.
	 *
	 * @param path - The path to convert.
	 * @returns the relative path.
	 */
	public relativeToRoot( path: string ){
		return normalizePath( relative( this.rootDir, path ) );
	}
	/**
	 * Resolve the path to a plugin file (resolved from the plugin `package.json`).
	 *
	 * @param path - The path to resolve.
	 * @returns the resolved path.
	 */
	public resolvePackageFile( path: string ){
		return normalizePath( resolve( this.pluginDir, path ) );
	}
}

export interface IPluginComponent<T extends ABasePlugin = ABasePlugin> {
	readonly plugin: T;
}

export type PluginAccessor<T extends ABasePlugin = ABasePlugin> = IPluginComponent<T> | T
export const getPlugin = <T extends ABasePlugin>( pluginAccessor: PluginAccessor<T> ) => pluginAccessor instanceof ABasePlugin ? pluginAccessor : pluginAccessor.plugin;

export type ApplicationAccessor = PluginAccessor | Application;
export const getApplication = ( applicationAccessor: ApplicationAccessor ) => applicationAccessor instanceof Application ? applicationAccessor : getPlugin( applicationAccessor ).application;
