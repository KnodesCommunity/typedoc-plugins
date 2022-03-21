import { escapeRegExp } from 'lodash';

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
			expect( x ).toHaveTextContent( reg, { normalizeWhitespace: true } );
			if( current ){
				expect( x ).toHaveClass( 'current' );
			} else {
				expect( x ).not.toHaveClass( 'current' );
			}
			const a = x.querySelector( 'a' );
			expect( a ).toBeTruthy();
			if( link === null ){
				expect( a ).not.toHaveAttribute( 'href' );
			} else {
				expect( a ).toHaveAttribute( 'href', link );
			}
		} ),
		`menuItemMatcher(text: ${JSON.stringify( text )}, current: ${JSON.stringify( current )}, link: ${JSON.stringify( link )})` ) );
};
