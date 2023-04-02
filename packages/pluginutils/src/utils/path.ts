// eslint-disable-next-line no-restricted-imports -- Re-export normalized
import { dirname as _dirname, join as _join, normalize as _normalize, relative as _relative, resolve as _resolve, basename, extname, isAbsolute, parse } from 'path';

import { isString } from 'lodash';

import { normalizePath } from 'typedoc';

export const resolve = ( from: string, ...to: Array<string | null | undefined> ) => normalizePath( _resolve( from, ...to.filter( isString ) ) );
export const join = ( ...paths: Array<string | null | undefined> ) => normalizePath( _join( ...paths.filter( isString ) ) );
export const relative = ( from: string, to: string ) => normalizePath( _relative( from, to ) );
export const dirname = ( path: string ) => normalizePath( _dirname( path ) );
export const normalize = ( path: string ) => normalizePath( _normalize( path ) );
export { isAbsolute, parse, basename, extname };
