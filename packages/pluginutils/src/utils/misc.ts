import { mkdirSync, statSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

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

export const Narrow = <T>( v: any ): v is T => true;
export const writeDiag = ( diagDir: string | undefined | null, file: string, content: () => string ) => {
	if( diagDir ){
		mkdirSync( diagDir, { recursive: true } );
		writeFileSync( resolve( diagDir, file ), content() );
	}
};
