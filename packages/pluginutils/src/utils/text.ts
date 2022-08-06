import { isString } from 'lodash';
import { JSX } from 'typedoc';

import { Narrow } from './misc';

export const getCoordinates = ( content: string, position: number ): {line: number; column: number} => {
	const beforeContent = content.slice( 0, position );
	const lines = beforeContent.split( '\n' );
	return { line: lines.length, column: lines[lines.length - 1].length + 1 };
};
export const jsxToString: {
	( val: JSX.Element | string ): string;
	<T>( val: JSX.Element | string | T ): string | T;
} = ( val: any ) => {
	if( isString( val ) ){
		return val;
	} else if( val && 'tag' in val && isString( val.tag ) && Narrow<JSX.Element>( val ) ) {
		return JSX.renderElement( val );
	} else {
		return val;
	}
};
