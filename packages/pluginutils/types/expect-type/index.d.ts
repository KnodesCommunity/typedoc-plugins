import 'expect-type';

declare module 'expect-type' {
	type MismatchArgs<B extends boolean, C extends boolean> = Eq<B, C> extends true ? [] : [never];
	interface ExpectTypeOf<Actual, B extends boolean> {
		toBeCallableWithArgs: <T extends any[] | [never]>( args: T, ...MISMATCH: MismatchArgs<Extends<T, Params<Actual>>, B> ) => true;
	}
}
