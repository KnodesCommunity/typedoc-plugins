import { deburr, kebabCase } from 'lodash';

export const trimExt = ( file: string, requireExt = true ) => {
	if( !file.match( /\.[^/.]+$/ ) ){
		if( !requireExt ){
			return file;
		}
		throw new Error( `Invalid non-extension filename "${file}"` );
	}
	return file.replace( /\.[^/.]+$/, '' );
};

export const urlize = ( name: string ) => kebabCase( deburr( name ) );
