import assert from 'assert';

import { identity, memoize, omit } from 'lodash';
import { Simplify } from 'type-fest';
import { DeclarationOption, DeclarationOptionToOptionType, ParameterTypeToOptionTypeMap } from 'typedoc';

import type { OptionGroup } from './option-group';
import { DeclarationOptionConfig, ParameterValueType } from './utils';
import type { ABasePlugin } from '../base-plugin';

type MapFn<TIn, TOut> = ( value: TIn ) => TOut;
export type MapperPart<TOpt, TDeclaration extends DeclarationOptionConfig<DeclarationOption>> = ParameterValueType<TDeclaration> extends TOpt ?
	[mapper?: MapFn<ParameterValueType<TDeclaration>, TOpt>] :
	[mapper: MapFn<ParameterValueType<TDeclaration>, TOpt>]
type InferParameterType<T> = keyof {[key in keyof ParameterTypeToOptionTypeMap as ParameterTypeToOptionTypeMap[key] extends T ? key : never]: true};
export type InferDeclarationType<T> = Simplify<DeclarationOption & {type: InferParameterType<T>}>;
export class Option<
	T,
	TDeclaration extends DeclarationOption = DeclarationOption,
> {
	public readonly name: string;
	private readonly _mapper: MapFn<ParameterValueType<TDeclaration>, T>;
	private readonly _declaration: TDeclaration;
	public get fullName(){
		return this.name === '__' ? this.plugin.optionsPrefix : `${this.plugin.optionsPrefix}:${this.name}`;
	}
	/**
	 * Generate a type-helper factory to constraint the option to be of the given {@link T2 type}.
	 *
	 * TODO: change signature once https://github.com/microsoft/TypeScript/pull/26349 is merged.
	 *
	 * @param plugin - The plugin declaring the option.
	 * @returns a function to call with the option declaration (& optional mapper).
	 */
	public static factory<T2>( plugin: ABasePlugin ) {
		return <TDec extends DeclarationOption>( declaration: TDec, ...mapper: MapperPart<T2, TDec> ) => new Option<T2, TDec>( plugin, null, declaration, ...mapper );
	}
	public constructor(
		public readonly plugin: ABasePlugin,
		public readonly group: OptionGroup<any, any> | null,
		declaration: TDeclaration,
		...[ mapper ]: MapperPart<T, TDeclaration>
	){
		this.name = declaration.name;
		if( !group ){
			if( declaration.name === '__' ){
				assert( this.plugin.application.options.getDeclarations().filter( d => d.name.startsWith( `${plugin.optionsPrefix}:` ) ).length === 0 );
			} else {
				assert( this.plugin.application.options.getDeclarations().filter( d => d.name === plugin.optionsPrefix ).length === 0 );
			}
		}
		this._declaration = {
			...( omit( declaration, 'mapper' ) as any as TDeclaration ),
			name: this.fullName,
			help: `[${this.plugin.package.name}]: ${declaration.help}`,
		};
		this.plugin.application.options.addDeclaration( this._declaration );
		mapper ??= identity;
		this._mapper = memoize( mapper as any );
	}

	/**
	 * Get the mapped value.
	 *
	 * @returns the value.
	 */
	public getValue(): T {
		const rawValue = this.plugin.application.options.getValue( this.fullName ) as ParameterValueType<TDeclaration>;
		return this._mapper( rawValue );
	}

	/**
	 * Set the raw value.
	 *
	 * @param value - The value to set.
	 */
	public setValue( value: DeclarationOptionToOptionType<TDeclaration> ) {
		this.plugin.application.options.setValue( this.fullName, value );
	}
}
