import { basename, dirname, relative } from 'path';

import { LoDashStatic, cloneDeep, isArray, isPlainObject, isString, template } from 'lodash';
import { normalizePath } from 'typedoc';

import { ITemplateMatch } from '../../options';

export interface ITemplateContext {
	_: LoDashStatic;
	path: Pick<typeof import( 'path' ), 'dirname' | 'basename' | 'relative'>;
}
const imports: Omit<ITemplateContext, '_'> = {
	path: {
		dirname: ( ...args: Parameters<typeof dirname> ) => normalizePath( dirname( ...args ) ),
		basename: ( ...args: Parameters<typeof basename> ) => normalizePath( basename( ...args ) ),
		relative: ( ...args: Parameters<typeof relative> ) => normalizePath( relative( ...args ) ),
	},
};

export const expandNode = <T>( node: T, match: ITemplateMatch ): T => {
	const nodeClone = cloneDeep( node ) as any;
	Object.entries( nodeClone ).forEach( ( [ k, v ] ) => {
		if( isString( v ) ){
			nodeClone[k] = template( v, { variable: 'match', imports } )( match );
		} else if( isArray( v ) ){
			nodeClone[k] = v.map( vv => expandNode( vv, match ) );
		} else if( isPlainObject( v ) ){
			nodeClone[k] = expandNode( v, match );
		}
	} );
	return nodeClone;
};
