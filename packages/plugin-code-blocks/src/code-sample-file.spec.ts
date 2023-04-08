import { vol } from 'memfs';

import { DEFAULT_BLOCK_NAME, readCodeSample } from './code-sample-file';

jest.mock( 'fs', () => jest.requireActual( 'memfs' ).fs );

afterEach( () => vol.reset() );
describe( 'Valid parses', () => {
	it.each( [
		[ 'No region', `Hello

World`, { [DEFAULT_BLOCK_NAME]: { startLine: 1, endLine: 3, code: 'Hello\n\nWorld' }} ],
		[ 'Single region', `Hello

World
// #region Test
Coucou
//#endregion`, { Test: { startLine: 4, endLine: 6, code: 'Coucou' }} ],
		[ 'Single region wide', `Hello

World
// #region Test
Coucou
//Test comment
Hello
//#endregion`, { Test: { startLine: 4, endLine: 8, code: 'Coucou\n//Test comment\nHello' }} ],
		[ 'Multiple regions', `//#region A
Hello

World
//#endregion
Wololo
// #region B
Coucou
//Test comment
Hello
//#endregion`, {
			A: { startLine: 1, endLine: 5, code: 'Hello\n\nWorld' },
			B: { startLine: 7, endLine: 11, code: 'Coucou\n//Test comment\nHello' },
		} ],
		[ 'Nested', `//#region A
Foo
// #region B
Bar
//#endregion
Qux
//#endregion`, {
			A: { startLine: 1, endLine: 7, code: 'Foo\nBar\nQux' },
			B: { startLine: 3, endLine: 5, code: 'Bar' },
		} ],
		[ 'Nested 2', `//#region A
Foo
// #region B
Bar
// #region C
Baz
//#endregion
Qux
//#endregion
Baaz
//#endregion`, {
			A: { startLine: 1, endLine: 11, code: 'Foo\nBar\nBaz\nQux\nBaaz' },
			B: { startLine: 3, endLine: 9, code: 'Bar\nBaz\nQux' },
			C: { startLine: 5, endLine: 7, code: 'Baz' },
		} ],
		[ 'Interleaved', `//#region A
Foo
// #region B
Bar
//#endregion A
Baz
//#endregion`, {
			A: { startLine: 1, endLine: 5, code: 'Foo\nBar' },
			B: { startLine: 3, endLine: 7, code: 'Bar\nBaz' },
		} ],
		[ 'Nested Interleaved', `//#region A
Foo
// #region B
Bar
// #region C
Baz
//#endregion B
Qux
// #endregion C
Baz
//#endregion`, {
			A: { startLine: 1, endLine: 11, code: 'Foo\nBar\nBaz\nQux\nBaz' },
			B: { startLine: 3, endLine: 7, code: 'Bar\nBaz' },
			C: { startLine: 5, endLine: 9, code: 'Baz\nQux' },
		} ],
	] )( 'should parse correctly "%s"', ( _, content, output ) => {
		vol.fromNestedJSON( {
			'test.txt': content,
		} );
		const res = Object.fromEntries( readCodeSample( 'test.txt' ).entries() );
		const expected = Object.fromEntries( Object.entries( output )
			.map( ( [ k, v ] ) => [ k, { ...v, file: 'test.txt', region: k } ] ) );
		expect( res ).toEqual( expected );
	} );
} );
