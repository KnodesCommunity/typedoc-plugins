import assert from 'assert';
import { join as _join } from 'path';

import { isObject, isString, startCase } from 'lodash';
import { PascalCase } from 'type-fest';
import { Reflection, normalizePath } from 'typedoc';

import { ANodeReflection } from '../../models/reflections';
import { IPageNode } from '../../options';

export const join = ( ...segments: Array<string | undefined | null> ) => {
	const segmentsNormalized = segments.filter( isString ).map( normalizePath );
	const joined = normalizePath( _join( ...segmentsNormalized ) );
	const leadingDots = segmentsNormalized[0].match( /^((\.{1,2}[/\\])+)/ );
	return `${leadingDots ? leadingDots[0] : ''}${joined}`;
};
export const traverseDeep = ( reflections: readonly Reflection[], cb: ( reflection: Reflection ) => void | boolean  ) => reflections.forEach( r => traverseSingle( r, cb ) );
const traverseSingle = ( reflection: Reflection, cb: ( reflection: Reflection ) => void | boolean ) => {
	cb( reflection );
	reflection.traverse( rr => traverseSingle( rr, cb ) );
};
const trimExt = ( file: string ) => {
	if( !file.match( /\.[^/.]+$/ ) ){
		throw new Error( `Invalid non-extension filename "${file}"` );
	}
	return file.replace( /\.[^/.]+$/, '' );
};
export const getDir = ( node: IPageNode, kind: 'output' | 'source' ): string => {
	const childKey = `children${startCase( kind )}Dir` as `children${PascalCase<typeof kind>}Dir`;
	const childVal = node[childKey];
	if( isString( childVal ) ){
		return childVal;
	} else if( isString( node.childrenDir ) ){
		return node.childrenDir;
	} else {
		const val = node[kind];
		if( !isString( val ) ){
			if( kind === 'output' ){
				return node.childrenDir ?? ( node.source ? trimExt( node.source ) : '.' );
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

type NodeOrRef = IPageNode | Reflection;
export const getNodePath = ( self?: NodeOrRef, parent?: NodeOrRef ): string => [ parent, self ]
	.filter( isObject )
	.flatMap( iterateNodeTitle )
	.map( p => JSON.stringify( p ) ).join( ' ⇥ ' );
const iterateNodeTitle = ( node?: NodeOrRef ): string[] => {
	if( node instanceof ANodeReflection ){
		return [ ...iterateNodeTitle( node.parent ), node.name ];
	} else if( node instanceof Reflection ){
		return [];
	} else if( node ){
		return [ node.title ];
	} else {
		return [];
	}
};
