import { isNil, isNumber } from 'lodash';
import { ReflectionKind } from 'typedoc';

const getHigherBitMask = () => Math.max( ...Object.values( { ...ReflectionKind, All: -1 } )
	.filter( isNumber )
	.map( v => v.toString( 2 ) )
	.filter( v => v.match( /^0*10*$/ ) )
	.map( v => parseInt( v, 2 ) ) );
export const addReflectionKind = ( ns: string, name: string, value?: number | null ) => {
	const fullName = `${ns}:${name}`;

	const kindAny = ReflectionKind as any;
	const existingValue = kindAny[fullName];
	if( !isNil( existingValue ) ){
		return existingValue;
	}
	const defaultedValue = value ?? ( getHigherBitMask() * 2 );
	kindAny[fullName] = defaultedValue;
	kindAny[defaultedValue] = fullName;
	return defaultedValue;
};
