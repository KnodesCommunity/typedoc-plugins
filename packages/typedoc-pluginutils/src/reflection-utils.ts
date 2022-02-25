import { isNumber } from 'lodash';
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
