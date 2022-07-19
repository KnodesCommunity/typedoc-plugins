import { statSync } from 'fs';
import { dirname } from 'path';

import { isFunction, isString, memoize } from 'lodash';
import { Application } from 'typedoc';

export const rethrow = <T>( block: () => T, newErrorFactory: ( err: any ) => string | Error ) => {
	try {
		return block();
	} catch( err: any ){
		const newErr = newErrorFactory( err );
		if( isString( newErr ) ){
			throw new Error( newErr, { cause: err } );
		} else {
			throw newErr;
		}
	}
};

export const catchWrap = <T>( block: () => T, contextMessage: string | ( ( err: any ) => any ) ) =>
	rethrow( block, err => isFunction( contextMessage ) ? contextMessage( err ) : new Error( contextMessage, { cause: err } ) );

export const rootDir = memoize( ( app: Application ) => {
	const opts = app.options.getValue( 'options' );
	const stat = statSync( opts );
	if( stat.isDirectory() ){
		return opts;
	} else if( stat.isFile() ){
		return dirname( opts );
	} else {
		throw new Error();
	}
} );
