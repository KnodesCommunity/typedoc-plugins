import { Except } from 'type-fest';
import {
	DeclarationOption,
	DeclarationOptionBase,
	FlagsDeclarationOption,
	MapDeclarationOption,
	ParameterType,
	ParameterTypeToOptionTypeMap,
} from 'typedoc';

declare const __compileError: unique symbol;
export interface TypeErr<ErrorMessageT extends any[]> {
	/**
	 * There should never be a value of this type
	 */
	readonly [__compileError] : never;
	error: ErrorMessageT;
}

export type DeclarationOptionConfig<T extends DeclarationOptionBase = DeclarationOption> = Except<T, 'name'>;
export type ExtractEnum<T> = T[keyof T]

interface TypeMap<T extends DeclarationOptionConfig> extends Omit<ParameterTypeToOptionTypeMap, ParameterType.Map | ParameterType.Flags> {
	[ParameterType.Map]: T extends DeclarationOptionConfig<MapDeclarationOption<infer U>> ? U & ExtractEnum<T['map']> : unknown;
	[ParameterType.Flags]: T extends DeclarationOptionConfig<FlagsDeclarationOption<infer U>> ? U : unknown;
}

export type ParameterValueType<T extends DeclarationOptionConfig> = NonNullable<T['type']> extends keyof TypeMap<T> ?
	TypeMap<T>[NonNullable<T['type']>] :
	TypeErr<['Unknown type', T['type']]> ;
