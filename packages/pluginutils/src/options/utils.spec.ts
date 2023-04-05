import { expectTypeOf  } from 'expect-type';
import {
	FlagsDeclarationOption as FlagsDec,
	LogLevel,
	MapDeclarationOption as MapDec,
	ParameterType as PType,
	StringDeclarationOption as StrDec,
} from 'typedoc';

import { ExtractEnum, ParameterValueType } from './utils';

describe( 'Typings', () => {
	const maybe = true as boolean;
	it( 'should infer correct types', () => {
		if( maybe ) return;
		expectTypeOf<ParameterValueType<StrDec>>().toEqualTypeOf<string>();
		expectTypeOf<ParameterValueType<MapDec<'foo' | 'bar'>>>().toEqualTypeOf<'foo' | 'bar'>();
		expectTypeOf<ParameterValueType<FlagsDec<Record<'baz' | 'qux', boolean>>>>().toEqualTypeOf<Record<'baz' | 'qux', boolean>>();

		expectTypeOf<ParameterValueType<{help: ''; type: PType.String}>>().toEqualTypeOf<string>();
		expectTypeOf<ParameterValueType<{help: ''; type: PType.Map; map: {[k: string]: 'foo' | 'qux'}; defaultValue: 'foo'}>>().toEqualTypeOf<'foo' | 'qux'>();
		expectTypeOf<ParameterValueType<{help: ''; type: PType.Flags; defaults: {baz: boolean; hello: boolean}}>>().toEqualTypeOf<Record<'baz' | 'hello', boolean>>();
		expectTypeOf<ParameterValueType<{help: ''; type: PType.Map; map: typeof LogLevel; defaultValue: LogLevel.Error}>>().toEqualTypeOf<LogLevel>();

		expectTypeOf<ExtractEnum<typeof LogLevel>>().toEqualTypeOf<LogLevel>();

		const mapKv = { help: '', type: PType.Map, map: { hello: 'foo', world: 'qux' }, defaultValue: 'foo' } as const;
		expectTypeOf<ParameterValueType<typeof mapKv>>().toEqualTypeOf<'foo' | 'qux'>();
		const mapLogLevel = { help: '', type: PType.Map, map: LogLevel, defaultValue: LogLevel.Error } as const;
		expectTypeOf<ParameterValueType<typeof mapLogLevel>>().toEqualTypeOf<LogLevel>();
		expectTypeOf<ExtractEnum<typeof LogLevel>>().toEqualTypeOf<LogLevel>();
	} );
} );
