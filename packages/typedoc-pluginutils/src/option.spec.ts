import { expectTypeOf } from 'expect-type';
import { MixedDeclarationOption, NumberDeclarationOption, StringDeclarationOption } from 'typedoc';

import { OptionDeclaration } from './option';

describe( 'Typings', () => {
	it( 'should require mapper for incompatible types', () => {
		expectTypeOf<OptionDeclaration<string, NumberDeclarationOption>>()
			.not.toEqualTypeOf<NumberDeclarationOption & {mapper?: ( v: number ) => string}>();
		expectTypeOf<OptionDeclaration<string, NumberDeclarationOption>>()
			.toEqualTypeOf<NumberDeclarationOption & {mapper: ( v: number ) => string}>();
		expectTypeOf<OptionDeclaration<string, StringDeclarationOption>>()
			.toEqualTypeOf<StringDeclarationOption & {mapper?: ( v: string ) => string}>();

		expectTypeOf<OptionDeclaration<number, StringDeclarationOption>>()
			.not.toEqualTypeOf<StringDeclarationOption & {mapper?: ( v: number ) => string}>();
		expectTypeOf<OptionDeclaration<number, StringDeclarationOption>>()
			.toEqualTypeOf<StringDeclarationOption & {mapper: ( v: string ) => number}>();
		expectTypeOf<OptionDeclaration<number, NumberDeclarationOption>>()
			.toEqualTypeOf<NumberDeclarationOption & {mapper?: ( v: number ) => number}>();

		type MyMap1 = Map<string, number>;
		expectTypeOf<OptionDeclaration<MyMap1, MixedDeclarationOption>>()
			.not.toEqualTypeOf<StringDeclarationOption & {mapper?: ( v: unknown ) => MyMap1}>();
		expectTypeOf<OptionDeclaration<MyMap1, MixedDeclarationOption>>()
			.toEqualTypeOf<MixedDeclarationOption & {mapper: ( v: unknown ) => MyMap1}>();
	} );
} );
