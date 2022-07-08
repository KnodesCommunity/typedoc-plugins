import assert from 'assert';
import { join as _join } from 'path';

import { isObject, isString, uniq } from 'lodash';
import { PascalCase } from 'type-fest';
import { ContainerReflection, DeclarationReflection, ProjectReflection, Reflection, normalizePath } from 'typedoc';

import { IPageNode } from '../../options';
import { ANodeReflection } from '../../reflections/a-node-reflection';

export const join = ( ...segments: Array<string | undefined> ) => normalizePath( _join( ...segments.filter( isString ) ) );
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

export const popReflectionFromProject = ( reflection: ContainerReflection, project: ProjectReflection ) => {
	popReflection( reflection );
	project.removeReflection( reflection );
};

export const popReflection = ( reflection: ContainerReflection ) => {
	const { parent } = reflection;
	assert( parent );
	const parentIsContainerReflection = parent instanceof ContainerReflection;
	const originalParentChildren = ( parentIsContainerReflection ? parent.children : undefined ) ?? [];
	if( parentIsContainerReflection ){
		parent.children = [];
	}
	linkReflections( parent, [
		...originalParentChildren,
		...( reflection.children ?? [] ),
	].filter( c => c !== reflection ) );
	reflection.parent = undefined;
	reflection.children = undefined;
};

export const linkReflections = ( parent: Reflection, children: DeclarationReflection[], prepend = false ) => {
	children.forEach( c => c.parent = parent );
	assert( parent instanceof ContainerReflection );
	( prepend ? prependChildren : appendChildren )( parent, ...children );
};

export const appendChildren = ( reflection: ContainerReflection, ...children: DeclarationReflection[] ) => {
	reflection.children = uniq( [ ...( reflection.children ?? [] ), ...children ] );
};
export const prependChildren = ( reflection: ContainerReflection, ...children: DeclarationReflection[] ) => {
	reflection.children = uniq( [ ...children, ...( reflection.children ?? [] ) ] );
};

export const instanceOf = <T>( ctor: abstract new ( ...args: any[] ) => T ) => ( v: any ): v is T => v instanceof ctor;

export const formatReflectionDebug = ( reflection: Reflection ) => `"${reflection.name} ${reflection.id}"`;
