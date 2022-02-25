import assert from 'assert';

import { identity, memoize, omit } from 'lodash';
import { LiteralUnion, SetOptional } from 'type-fest';
import { Application, DeclarationOption, DeclarationOptionToOptionType, ParameterTypeToOptionTypeMap } from 'typedoc';

import type { ABasePlugin } from './base-plugin';

export type FullOptionDeclaration<T, TDeclaration extends DeclarationOption> = TDeclaration & {
	mapper: ( value: DeclarationOptionToOptionType<TDeclaration> ) => T;
	name: LiteralUnion<'__', string>;
}
export type OptionDeclaration<T, TDeclaration extends DeclarationOption> = DeclarationOptionToOptionType<TDeclaration> extends T ?
	SetOptional<FullOptionDeclaration<T, TDeclaration>, 'mapper'> :
	FullOptionDeclaration<T, TDeclaration>
export type InferDeclarationType<T> = DeclarationOption & {
	type: keyof {[key in keyof ParameterTypeToOptionTypeMap]: ParameterTypeToOptionTypeMap[key] extends T ? ParameterTypeToOptionTypeMap[key] : never};
}
export class Option<T, TDeclaration extends DeclarationOption = InferDeclarationType<T>> {
	private readonly _mapper: ( v: DeclarationOptionToOptionType<TDeclaration> ) => T;
	private readonly _declaration: TDeclaration;
	public constructor(
		private readonly _app: Application,
		private readonly _plugin: ABasePlugin,
		optionDeclaration: OptionDeclaration<T, TDeclaration>,
	){
		const name = optionDeclaration.name === '__' ? _plugin.optionsPrefix : `${_plugin.optionsPrefix}:${optionDeclaration.name}`;
		if( optionDeclaration.name === '__' ){
			assert( this._app.options.getDeclarations().filter( d => d.name.startsWith( `${_plugin.optionsPrefix}:` ) ).length === 0 );
		} else {
			assert( this._app.options.getDeclarations().filter( d => d.name === _plugin.optionsPrefix ).length === 0 );
		}
		this._declaration = {
			...( omit( optionDeclaration, 'mapper' ) as any as TDeclaration ),
			name,
			help: `[${this._plugin.package.name}]: ${optionDeclaration.help}`,
		};
		this._app.options.addDeclaration( this._declaration );
		this._mapper = memoize( optionDeclaration.mapper ?? identity );
	}

	/**
	 * Get the mapped value.
	 *
	 * @returns the value.
	 */
	public getValue(): T {
		const rawValue = this._app.options.getValue( this._declaration.name ) as DeclarationOptionToOptionType<TDeclaration>;
		return this._mapper( rawValue );
	}
}
