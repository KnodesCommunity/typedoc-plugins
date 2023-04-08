const assert = require( 'assert' );

const { isArray } = require( 'lodash' );
const { parseDocument: parseYamlDocument, visit, stringify: stringifyYaml, YAMLSeq } = require( 'yaml' );

const resolveRefFactory = ( anchorsMap, vars ) => ( ref, src ) => {
	if( ref.startsWith( '*' ) ){
		const node = anchorsMap[ref.slice( 1 )]?.clone() ??
			assert.fail( `Missing alias "${ref}" in expression "${JSON.stringify( src )}"` );
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
			assert.fail( `Missing variable "${ref}" in expression "${JSON.stringify( src )}"` );
		return {
			'': () => val,
			'!': () => val.toString(),
			'...': () => {
				assert( isArray( val ) );
				return val.map( i => JSON.stringify( i.trim() ) ).join( ', ' );
			},
		};
	}
};

module.exports.postProcessYaml = ( yamlStr, vars = {} ) => {
	const doc = parseYamlDocument( yamlStr );
	const ANCHORS_MAP = {};
	visit( doc, ( _key, node ) => {
		if( node && node.anchor ){
			ANCHORS_MAP[node.anchor] = node;
		}
	} );
	const resolveRef = resolveRefFactory( ANCHORS_MAP, vars );
	return yamlStr.replace( /^(\s*)[^#\n]*?(#\s*!FORMAT\s*(.*))$/gm, ( src, indent, formatAppendix, format ) => {
		const formatted = format.replace( /\$\{\s?(!|\.\.\.)?(.*?)\s*\}/g, ( _, operator, ref ) => {
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
