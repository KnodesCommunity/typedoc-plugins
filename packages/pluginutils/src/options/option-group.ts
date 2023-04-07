import assert from 'assert';

import { closest } from 'fastest-levenshtein';
import { defaultsDeep, difference, get, identity, kebabCase } from 'lodash';
import { DeclarationOption, MixedDeclarationOption, ParameterType } from 'typedoc';

import { dirname } from '@knodes/typedoc-pluginutils/path';

import { MapperPart, Option } from './option';
import { DeclarationOptionConfig, ParameterValueType, TypeErr } from './utils';
import type { ABasePlugin } from '../base-plugin';
import { EventsExtra } from '../events-extra';

interface Builder<T extends Record<string, any>, TDecs extends Record<never, DeclarationOption>> {
	add: <
		K extends keyof T & Exclude<keyof T, keyof TDecs>,
		TDec extends DeclarationOptionConfig<DeclarationOption>,
	>(
		name: K,
		declaration: TDec,
		...mapper: MapperPart<T[K], TDec>
	) => Builder<T, TDecs & {[k in K]: TDec & {name: K}}>;
	build: [Exclude<keyof T, keyof TDecs>] extends [never] ?
		TDecs extends Record<keyof T, DeclarationOptionConfig> ?
			() => OptionGroup<T, {[k in keyof TDecs]: TDecs[k] & DeclarationOption;}> :
			TypeErr<['Invalid case']> :
		TypeErr<['Missing declarations for keys', Exclude<keyof T, keyof TDecs>]>;
}

type OptionGroupSetValue<TDeclarations extends Record<string, DeclarationOptionConfig>> = {
	[k in keyof TDeclarations]?: ParameterValueType<TDeclarations[k]>
};
export class OptionGroup<
	T extends Record<string, any>,
	TDeclarations extends {[k in keyof T]: DeclarationOptionConfig} = {[k in keyof T]: DeclarationOptionConfig}
> {
	private readonly _options: {[k in keyof TDeclarations]: Option<k extends keyof T ? T[k] : unknown, TDeclarations[k] & {name: k} & DeclarationOption>};
	/**
	 * Generate a type-helper factory to constraint the option to be of the given {@link T2 type}.
	 *
	 * TODO: change signature once https://github.com/microsoft/TypeScript/pull/26349 is merged.
	 *
	 * @param plugin - The plugin declaring the option.
	 * @returns a builder to use in order to generate the full option group.
	 */
	public static factory<T2 extends Record<never, unknown>>( plugin: ABasePlugin ){
		return this._build<T2, Record<never, DeclarationOption>>( plugin, {}, {} );
	}
	/**
	 * Create the actual option builder.
	 *
	 * @param plugin - The plugin declaring the option.
	 * @param decs - The declarations so far.
	 * @param mappers - The mappers so far.
	 * @returns the builder to chain.
	 */
	private static _build<T2 extends Record<string, any>, TDecs extends Record<never, DeclarationOption>>(
		plugin: ABasePlugin,
		decs: TDecs,
		mappers: Record<string, ( v: any ) => any>,
	): Builder<T2, TDecs> {
		return {
			add: ( name: Exclude<keyof T2, keyof TDecs>, dec: DeclarationOptionConfig, ...[ mapper ]: [mapper?: any] ) =>
				OptionGroup._build(
					plugin,
					{ ...decs, [name]: { ...dec, name }},
					{ ...mappers, [name]: mapper ?? identity },
				),
			build: () => new OptionGroup( plugin, decs, mappers as any ),
		} as any as Builder<T2, TDecs>;
	}

	private get _rootOption(): MixedDeclarationOption {
		const linkAppendix = 'documentation' in this.plugin.package ?
			` See \u001b[96m${( this.plugin.package as any ).documentation}\u001b[0m for more informations.` : // Cyan
			'';
		return {
			name: this.plugin.optionsPrefix,
			type: ParameterType.Mixed,
			help: `[${this.plugin.package.name}]: Set all plugin options below as an object, a JSON string or from a file.${linkAppendix}`,
		};
	}

	public constructor(
		public readonly plugin: ABasePlugin,
		optionDeclarations: TDeclarations,
		mappers: {[k in keyof T]: ( v: any ) => T[k]},
	){
		this._options = Object.fromEntries( ( Object.entries( optionDeclarations ) as Array<[k: keyof T & string, v: TDeclarations[keyof T & string]]> )
			.map( ( [ k, v ] ) => {
				assert( k !== 'options' );
				const fullDec: DeclarationOption = { ...v, name: k };
				const opt = new Option( plugin, this, fullDec, mappers[k] );
				return [ k, opt ];
			} ) ) as any;
		this.plugin.application.options.addDeclaration( this._rootOption );

		EventsExtra.for( this.plugin.application )
			.beforeOptionsFreeze( this._onBeforeOptionsFreeze.bind( this ) );
	}

	/**
	 * Get the mapped values.
	 *
	 * @returns the group values.
	 */
	public getValue(): T {
		return this._mapOptions( ( k, o ) => o.getValue() ) as any;
	}

	/**
	 * Set the raw values.
	 *
	 * @param value - The value to set. Paths, JSON & partial options are authorized
	 */
	public setValue( value: OptionGroupSetValue<TDeclarations> | string ): void
	public setValue<TK extends keyof TDeclarations>( key: TK, value: ParameterValueType<TDeclarations[TK]> ): void
	public setValue( ...args: [OptionGroupSetValue<TDeclarations> | string] | [key: keyof TDeclarations, value: ParameterValueType<TDeclarations[keyof TDeclarations]>] ): void
	public setValue( ...args: [OptionGroupSetValue<TDeclarations> | string] | [key: keyof TDeclarations, value: ParameterValueType<TDeclarations[keyof TDeclarations]>] ){
		if( args.length === 2 ){
			const [ key, value ] = args;
			return this._setValue( { [key]: value } as any );
		}
		try {
			this._setValue( args[0] );
		} catch( e: any ){
			if ( e.code !== 'MODULE_NOT_FOUND' ) {
				throw e;
			}
			this.plugin.logger.error( `Config file ${args[0]} not found` );
		}
	}

	/**
	 * Set the raw values.
	 *
	 * @param value - The value to set. Paths, JSON & partial options are authorized.
	 * @returns nothing.
	 */
	private _setValue( value: OptionGroupSetValue<TDeclarations> | string ): void {
		if( typeof value === 'object' ){
			return this._setValueFromObject( value );
		} else if( value.startsWith( '{' ) && value.endsWith( '}' ) ){
			const parsedValue = JSON.parse( value ) as OptionGroupSetValue<TDeclarations>;
			this._setValue( parsedValue );
		} else {
			this._setValueFromFile( value );
		}
	}

	/**
	 * Set the raw values from a POJO.
	 *
	 * @param value - The values to set as object.
	 */
	private _setValueFromObject( value: OptionGroupSetValue<TDeclarations> ){
		const valKeys = Object.keys( value );
		const optKeys = Object.keys( this._options );
		for( const unknownOption of difference( valKeys, optKeys ) ){
			this.plugin.logger.warn( `Unknown option "${unknownOption}". Did you mean "${closest( unknownOption, optKeys )}" ?` );
		}
		const newOpts = this._mapOptions( ( k, o ) => {
			if( k in value ) {
				try {
					o.setValue( value[k] as any );
				} catch( err: any ){
					throw new Error( `Could not set option "${o.fullName}": ${err.message ?? err}`, { cause: err } );
				}
			}
			return o.getValue();
		} );
		this.plugin.application.options.setValue( this.plugin.optionsPrefix, newOpts );
	}

	/**
	 * Load the given file as being the full plugin options.
	 *
	 * @param filename - The file containing options. Any `require`able file can be provided.
	 */
	private _setValueFromFile( filename: string ){
		const [ filePath, objPath, ...left ] = filename.split( '#' );
		assert( left.length === 0 );
		this.plugin.logger.verbose( `Reading config file @ ${filePath}` );
		const optsDirFile = this.plugin.application.options.getValue( 'options' );
		const resolved = require.resolve( filePath, { paths: [ process.cwd(), optsDirFile, dirname( optsDirFile ) ] } );
		// eslint-disable-next-line @typescript-eslint/no-var-requires -- Rely in node require
		const result = require( resolved );
		if( objPath ){
			this._setValue( get( result, objPath ) );
		} else {
			this._setValue( result );
		}
	}

	/**
	 * Try loading different options sources, and update plugin options with default values if not set.
	 */
	private _onBeforeOptionsFreeze(){
		const defaultOpts = this.getValue();
		// Try read default files
		const generalOpts = this.plugin.application.options.getValue( this.plugin.optionsPrefix ) as any;
		if( generalOpts ){
			this._setValue( generalOpts );
		} else {
			try {
				this._setValueFromFile( `./typedoc-${kebabCase( this.plugin.optionsPrefix )}` );
			// eslint-disable-next-line no-empty -- No-op error
			} catch( _err ){}
		}
		this.setValue( defaultsDeep( this.getValue(), defaultOpts ) );
	}

	/**
	 * Execute a {@link cb callback} on each declared options, & return an object containing the resulting values.
	 *
	 * @param cb - The function to execute on each option. Called with the key & the {@link Option}.
	 * @returns the mapped values.
	 */
	private _mapOptions<U>( cb: <TK extends keyof T>( key: TK, option: Option<T[TK], TDeclarations[TK] & {name: TK} & DeclarationOption> ) => U ): {[K in keyof T]: U}{
		return Object.fromEntries( ( Object.entries( this._options ) as Array<[k: keyof T, v: Option<any, any>]> )
			.map( ( [ k, v ] ) => [ k, cb( k, v ) ] as const ) ) as any;
	}
}
