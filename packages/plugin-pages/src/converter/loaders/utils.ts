import glob from 'glob';
import { castArray, difference, isArray, isNil, isString, omit, uniq } from 'lodash';
import minimatch, { filter as filterMatch } from 'minimatch';

export type GlobMatch = string | string[]

type GlobOpts = Omit<glob.IOptions, 'cwd' | 'root'> & {from?: string} | undefined;
export const globMatch = ( pattern: GlobMatch, options?: GlobOpts ) => {
	const optsDefaulted = { ...omit( options, 'from' ), cwd: options?.from, root: options?.from };
	if( isNil( optsDefaulted.cwd ) ){
		delete optsDefaulted.cwd;
	}
	return castArray( pattern )
		.reduce<string[]>( ( acc, p ) => {
			if( p.startsWith( '!' ) ){
				const filtered = difference( acc, acc.filter( filterMatch( p.slice( 1 ), optsDefaulted ) ) );
				return filtered;
			} else {
				const files = glob.sync( p, optsDefaulted );
				const newAcc = uniq( [ ...acc, ...files ] );
				return newAcc;
			}
		}, [] );
};
export const doesMatch = ( value: string, pattern: GlobMatch, options?: GlobOpts ) => {
	const optsDefaulted = { ...omit( options, 'from' ), cwd: options?.from, root: options?.from };
	return castArray( pattern ).every( p => minimatch( value, p, optsDefaulted ) );
};

export const isValidGlobMatch = ( v: unknown ): v is GlobMatch => ( isArray( v ) && v.length > 0 && v.every( isString ) ) || isString( v );
