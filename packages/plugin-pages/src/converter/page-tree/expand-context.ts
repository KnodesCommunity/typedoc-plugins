import { basename, dirname, relative } from 'path';

import { LoDashStatic, cloneDeep, isArray, isPlainObject, isString, template } from 'lodash';
import { normalizePath } from 'typedoc';

export interface IExpandContext {
	from: string;
	match: string;
	fullPath: string;
	prev: IExpandContext[];
}

export interface IExpandContextImports{
	_: LoDashStatic;
	path: Pick<typeof import( 'path' ), 'dirname' | 'basename' | 'relative'>;
}
const imports: Omit<IExpandContextImports, '_'> = {
	path: {
		dirname: ( ...args: Parameters<typeof dirname> ) => normalizePath( dirname( ...args ) ),
		basename: ( ...args: Parameters<typeof basename> ) => normalizePath( basename( ...args ) ),
		relative: ( ...args: Parameters<typeof relative> ) => normalizePath( relative( ...args ) ),
	},
};

export const expandNode = <T>( node: T, context: IExpandContext ): T => {
	const nodeClone = cloneDeep( node ) as any;
	Object.entries( nodeClone ).forEach( ( [ k, v ] ) => {
		if( isString( v ) ){
			nodeClone[k] = template( v, { variable: 'context', imports } )( context );
		} else if( isArray( v ) ){
			nodeClone[k] = v.map( vv => expandNode( vv, context ) );
		} else if( isPlainObject( v ) ){
			nodeClone[k] = expandNode( v, context );
		}
	} );
	return nodeClone;
};
