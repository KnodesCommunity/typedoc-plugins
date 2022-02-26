import assert from 'assert';
import { resolve } from 'path';

import { isNumber, isPlainObject, isString } from 'lodash';
import { LogLevel } from 'typedoc';

import { IPluginOptions } from './plugin-options';

export const readPluginOptions = ( optionsRaw: unknown ): IPluginOptions => {
	const opts = readOption( optionsRaw );
	if( !( 'source' in opts ) ){
		opts.source = 'pages';
	}
	if( !( 'output' in opts ) ){
		opts.output = 'pages';
	}
	if( 'logLevel' in opts ){
		if( isString( opts.logLevel ) ){
			assert( opts.logLevel in LogLevel );
			opts.logLevel = LogLevel[opts.logLevel] as any;
		} else if( isNumber( opts.logLevel ) ){
			assert( Object.values( LogLevel ).includes( opts.logLevel ) );
		}
	}
	// TODO: validate;
	return opts;
};

const readOption = ( optionsRaw: unknown ): IPluginOptions => {
	try {
		if ( typeof optionsRaw === 'string' ) {
			const trimmed = optionsRaw.trim();
			if( trimmed.startsWith( '{' ) && trimmed.endsWith( '}' ) ){
				return JSON.parse( trimmed );
			}
			return tryReadOptionsFromFile( optionsRaw );
		} else if( optionsRaw && isPlainObject( optionsRaw ) ){
			return optionsRaw as any;
		}

		if ( !optionsRaw ) {
			try {
				return tryReadOptionsFromFile( './pagesconfig.json' );
			} catch( e: any ){
				if( typeof e.message === 'string' && e.message.startsWith( 'Cannot find module' ) ){
					return tryReadOptionsFromFile( './pagesconfig.js' );
				} else {
					throw e;
				}
			}
		}
		throw new Error( 'No options were provided.' );
	} catch ( e: any ) {
		throw new Error( `Failed to read plugin options. ${e.message ?? e}` );
	}
};

const tryReadOptionsFromFile = ( path: string ) => require( resolve( path ) );
