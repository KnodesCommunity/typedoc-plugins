import assert, { fail } from 'assert';

import _ from 'lodash';
import { YAMLSeq, parseDocument as parseYamlDocument, stringify as stringifyYaml, visit } from 'yaml';

const resolveRefFactory = ( anchorsMap, vars ) => ( ref, src ) => {
	if( ref.startsWith( '*' ) ){
		const node = anchorsMap[ref.slice( 1 )]?.clone() ??
			fail( `Missing alias "${ref}" in expression "${JSON.stringify( src )}"` );
		node.anchor = undefined;
		return {
			'': () => stringifyYaml( node ).trim(),
			'!': () => node.toString(),
			'...': () => {
				assert( node instanceof YAMLSeq );
				return node.items.map( i => stringifyYaml( i ).trim() ).join( ', ' );
			},
		};
	} else {
		const val = vars[ref] ??
			fail( `Missing variable "${ref}" in expression "${JSON.stringify( src )}"` );
		return {
			'': () => val,
			'!': () => val.toString(),
			'...': () => {
				assert( _.isArray( val ) );
				return val.map( i => JSON.stringify( i.trim() ) ).join( ', ' );
			},
		};
	}
};

export const postProcessYaml = ( yamlStr, vars = {} ) => {
	const doc = parseYamlDocument( yamlStr );
	const ANCHORS_MAP = {};
	visit( doc, ( _key, node ) => {
		if( node && node.anchor ){
			ANCHORS_MAP[node.anchor] = node;
		}
	} );
	const resolveRef = resolveRefFactory( ANCHORS_MAP, vars );
	return yamlStr.replace( /^(\s*)[^#\n]*?(#\s*!FORMAT\s*(.*))$/gm, ( src, indent, formatAppendix, format ) => {
		const formatted = format.replace( /\$\{\s?(!|\.\.\.)?(.*?)\s*\}/g, ( __, operator, ref ) => {
			operator = operator ?? '';
			const resolver = resolveRef( ref, src );
			if( !( operator in resolver ) ){
				throw new SyntaxError( `Unexpected operator "${operator}"` );
			}
			return resolver[operator]();
		} );
		return `${indent}${formatted} ${formatAppendix}`;
	} );
};
