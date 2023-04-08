import { escapeRegExp } from 'lodash';

import { resolve } from '@knodes/typedoc-pluginutils/path';

const setName = ( fn: any, name: string ) => {
	Object.defineProperty( fn, 'toString', { value: () => name, writable: true } );
	return fn;
};
const passes = <T extends unknown[]>( assert: ( ...args: T ) => void ) => setName( ( ...args: T ) => {
	try{
		assert( ...args );
		return true;
	} catch( _e ){
		return false;
	}
}, `passes(${assert.toString()})` );
export const menuItemMatcher = ( text: string, current: boolean, link: string | null ) => {
	const reg = new RegExp( `^${escapeRegExp( text )}$` );
	return expect.toSatisfy( setName(
		passes( ( x: HTMLLIElement ) => {
			if( current ){
				expect( x ).toHaveClass( 'current' );
			} else {
				expect( x ).not.toHaveClass( 'current' );
			}
			const a = x.querySelector( 'a' );
			expect( a ).toHaveTextContent( reg, { normalizeWhitespace: true } );
			expect( a ).toBeTruthy();
			if( link === null ){
				expect( a ).not.toHaveAttribute( 'href' );
			} else {
				expect( a ).toHaveAttribute( 'href', link );
			}
		} ),
		`menuItemMatcher(text: ${JSON.stringify( text )}, current: ${JSON.stringify( current )}, link: ${JSON.stringify( link )})` ) );
};
export const elementMatcher = ( elemDescriptor: {textContent?: string; attrs?: Record<string, any>} ) => {
	const textContentRegex = elemDescriptor.textContent ? new RegExp( `^${escapeRegExp( elemDescriptor.textContent )}$` ) : undefined;
	return expect.toSatisfy( setName(
		passes( ( x: HTMLLIElement ) => {
			if( textContentRegex ) {
				expect( x ).toHaveTextContent( textContentRegex, { normalizeWhitespace: true } );
			}
			if( elemDescriptor.attrs ){
				Object.entries( elemDescriptor.attrs )
					.forEach( ( [ k, v ] ) => {
						expect( x ).toHaveAttribute( k, v );
					} );
			}
		} ),
		`elementMatcher(elemDescriptor: ${JSON.stringify( elemDescriptor )}` ) );
};
export const pluginPath = resolve( __dirname, '../src/index' );
export const mockFs = ( path: string ) => resolve( __dirname, 'mock-fs', path );
