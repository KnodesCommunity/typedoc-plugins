import assert from 'assert';
import { join } from 'path';

import { PascalCase } from 'type-fest';
import { Reflection } from 'typedoc';

import { IPageNode } from '../options';

export const resolve = ( base?: string, ...left: string[] ) => {
	const segments: string[] = [];
	if( base ){
		segments.push( base );
	}
	segments.push( ...left );
	return join( ...segments );
};
export const traverseDeep = ( reflections: readonly Reflection[], cb: ( reflection: Reflection ) => void ) => reflections.forEach( r => {
	r.traverse( rr => cb( rr ) );
	cb( r );
} );
const trimExt = ( file: string ) => {
	if( !file.match( /\.[^/.]+$/ ) ){
		throw new Error( `Invalid non-extension filename "${file}"` );
	}
	return file.replace( /\.[^/.]+$/, '' );
};
export const getDir = ( node: IPageNode, kind: 'output' | 'source' ): string => {
	const childKey = `children${kind[0].toUpperCase()}${kind.slice( 1 )}Dir` as `children${PascalCase<typeof kind>}Dir`;
	const childVal = node[childKey];
	if( childVal ){
		return childVal;
	} else if( node.childrenDir ){
		return node.childrenDir;
	} else {
		const val = node[kind];
		if( !val ){
			if( kind === 'output' ){
				return getDir( node, 'source' );
			}
			return '.';
		}
		return trimExt( val );
	}
};

export const getNodeUrl = ( node: IPageNode ): string => {
	if( node.output ){
		if( node.output.endsWith( '.html' ) ){
			return node.output;
		} else {
			// TODO: Maybe throw if confix
			return `${node.output}.html`;
		}
	} else {
		assert( node.source );
		const filenameNoExt = trimExt( node.source );
		if( node.children ){
			return `${filenameNoExt}/index.html`;
		}
		return `${filenameNoExt}.html`;
	}
};

export const getReflectionPath = ( reflection?: Reflection ): string[] => {
	if( !reflection ){
		return [];
	} else {
		return [
			...getReflectionPath( reflection.parent ),
			reflection.name,
		];
	}
};
