import { GlobOptions, GlobOptionsWithFileTypesFalse, globSync } from 'glob';
import { castArray, difference, isArray, isNil, isString, omit, uniq } from 'lodash';
import { filter as filterMatch, minimatch } from 'minimatch';

export type GlobMatch = string | string[]

type GlobOpts = Omit<GlobOptions, 'cwd' | 'root'> & {from?: string} | undefined;
export const globMatch = ( pattern: GlobMatch, options?: GlobOpts ) => {
	const optsDefaulted: GlobOptionsWithFileTypesFalse = {
		...omit( options, 'from' ),
		cwd: options?.from,
		root: options?.from,
		withFileTypes: false,
	};
	if( isNil( optsDefaulted.cwd ) ){
		delete optsDefaulted.cwd;
	}
	return castArray( pattern )
		.reduce<string[]>( ( acc, p ) => {
			if( p.startsWith( '!' ) ){
				const filtered = difference( acc, acc.filter( filterMatch( p.slice( 1 ), optsDefaulted ) ) );
				return filtered;
			} else {
				const files = globSync( p, optsDefaulted ) as string[];
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
