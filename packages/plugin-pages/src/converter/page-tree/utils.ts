import assert from 'assert';

import { isArray, isObject } from 'lodash';
import { Reflection } from 'typedoc';

import { ANodeReflection } from '../../models/reflections';
import { INodeInParent, SourceNode } from '../loaders';

export type NodesTreeBuild = {defs: SourceNode[]; children: NodesTreeBuild[]};
const findInNodesTreeBuildByName = ( nodes: NodesTreeBuild[], name: string ) => nodes.find( known => known.defs.some( def => def.name === name ) );
const findSubTree = ( parents: SourceNode[], tree: NodesTreeBuild[] ) => {
	parents = [ ...parents ].reverse();
	while( parents.length !== 0 ){
		const treeDef = findInNodesTreeBuildByName( tree, parents[0].name );
		assert( treeDef );
		tree = treeDef.children;
		parents = parents.slice( 1 );
	}
	return tree;
};
export const buildNodesTree = ( nodes: INodeInParent[] ) =>
	nodes.reduce<NodesTreeBuild[]>( ( acc, n ) => {
		const subTree = findSubTree( n.parents, acc );
		const mergeTarget = findInNodesTreeBuildByName( subTree, n.node.name );
		if( mergeTarget ){
			mergeTarget.defs.push( n.node );
		} else {
			subTree.push( { defs: [ n.node ], children: [] } );
		}
		return acc;
	}, [] );

type NodeOrRef = ANodeReflection | NodesTreeBuild | {name?: string} | Reflection;
export const getNodePath = ( self?: NodeOrRef, parent?: NodeOrRef ): string => [ parent, self ]
	.filter( isObject )
	.flatMap( iterateNodeName )
	.map( p => JSON.stringify( p ) ).join( ' ⇥ ' );
const isNodeTreeBuild = ( v: any ): v is NodesTreeBuild => v && 'defs' in v && isArray( v.defs );
const iterateNodeName = ( node?: NodeOrRef ): string[] => {
	if( node instanceof ANodeReflection ){
		return [ ...iterateNodeName( node.parent ), node.name ];
	} else if( node instanceof Reflection ){
		return [];
	} else if( isNodeTreeBuild( node ) ){
		return [ node.defs[0].name ];
	} else if( node ){
		return [ node.name ?? 'UNKNOWN' ];
	} else {
		return [];
	}
};
