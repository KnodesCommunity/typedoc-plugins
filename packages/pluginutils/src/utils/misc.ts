import { isNumber, isString } from 'lodash';
import { ReflectionKind } from 'typedoc';

export const addReflectionKind = ( ns: string, name: string, value?: number ) => {
	const fullname = `${ns}:${name}`;

	value = value ??
		( Math.max( ...Object.values( { ...ReflectionKind, All: -1 } ).filter( isNumber ) ) * 2 );
	const kindAny = ReflectionKind as any;
	kindAny[fullname] = value;
	kindAny[value] = fullname;
	return value;
};

export const rethrow = <T>( block: () => T, newErrorFactory: ( err: any ) => string | Error ) => {
	try {
		return block();
	} catch( err ){
		const newErr = newErrorFactory( err );
		if( isString( newErr ) ){
			throw new Error( newErr );
		} else {
			throw newErr;
		}
	}
};
