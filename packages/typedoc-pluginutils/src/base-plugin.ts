import assert from 'assert';
import { basename, dirname } from 'path';

import { camelCase } from 'lodash';
import { sync as pkgUpSync } from 'pkg-up';
import { satisfies } from 'semver';
import { PackageJson, ReadonlyDeep, SetRequired } from 'type-fest';
import { Application, DeclarationOption } from 'typedoc';

import { InferDeclarationType, Option, OptionDeclaration } from './option';

import { PluginLogger } from './plugin-logger';

type RequiredPackageJson = SetRequired<PackageJson, 'name' | 'version'>
export abstract class ABasePlugin {
	public readonly optionsPrefix: string;
	public readonly package: ReadonlyDeep<RequiredPackageJson>;
	public readonly logger: PluginLogger;
	/**
	 * Instanciate a new instance of the base plugin. The `package.json` file will be read to obtain the plugin name & the TypeDoc compatible range.
	 * Logs a warning if the current TypeDoc version is not compatible.
	 *
	 * @param application - The application instance.
	 * @param pluginFilename - The actual plugin file name. Used to lookup the `package.json` file.
	 */
	public constructor( protected readonly application: Application, pluginFilename: string ){
		const pkgFile = pkgUpSync( { cwd: dirname( pluginFilename ) } );
		if( !pkgFile ){
			throw new Error( 'Could not determine package.json' );
		}
		// eslint-disable-next-line @typescript-eslint/no-var-requires -- Require package.json
		const pkg: ReadonlyDeep<PackageJson> = require( pkgFile );
		assert( pkg.name );
		assert( pkg.version );
		this.package = pkg as RequiredPackageJson;
		this.logger = new PluginLogger( application, this );
		this.logger.verbose( `Using plugin version ${pkg.version}` );
		const typedocPeerDep = pkg.peerDependencies?.typedoc ?? pkg.dependencies?.typedoc;
		assert( typedocPeerDep );
		if( !satisfies( Application.VERSION, typedocPeerDep ) ){
			this.logger.warn( `TypeDoc version ${Application.VERSION} does not match the plugin's peer dependency range ${typedocPeerDep}. You might encounter problems.` );
		}
		this.optionsPrefix = camelCase( basename( pkg.name ).replace( /^typedoc-/, '' ) );
	}

	/**
	 * This method is called after the plugin has been instanciated.
	 *
	 * @see {@link import('./autoload').autoload}.
	 */
	public abstract initialize(): void;

	/**
	 * Instanciate a new option & auto-register it.
	 *
	 * @param declaration - The option declaration.
	 * @returns the new option.
	 */
	protected addOption<T, TDeclaration extends DeclarationOption = InferDeclarationType<T>>( declaration: OptionDeclaration<T, TDeclaration> ){
		return new Option( this.application, this, declaration );
	}
}
