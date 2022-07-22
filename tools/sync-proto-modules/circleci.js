const assert = require( 'assert' );
const { readFile } = require( 'fs/promises' );

const { parseDocument: parseYamlDocument, visit, stringify: stringifyYaml, YAMLSeq } = require( 'yaml' );

const { resolveRoot } = require( '../utils' );
const { syncFile } = require( './utils' );

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler}
 */
module.exports.circleCi = async checkOnly => ( {
	tearDown: async() => {
		const circleCiPath = resolveRoot( '.circleci/config.yml' );
		const currentCircleCi = await readFile( circleCiPath, 'utf-8' );
		const nvmRc = await readFile( resolveRoot( '.nvmrc' ) );

		const cfgNvmSet = currentCircleCi.replace( /&test-matrix-node-versions-default "\S+"/, `&test-matrix-node-versions-default "${nvmRc}"` );

		const doc = parseYamlDocument( cfgNvmSet );
		const ANCHORS_MAP = {};
		visit( doc, ( _key, node ) => {
			if( node && node.anchor ){
				ANCHORS_MAP[node.anchor] = node;
			}
		} );
		const cfgFormatted = cfgNvmSet.replace( /^(\s*)[^#\n]*?(#\s*!FORMAT\s*(.*))$/gm, ( src, indent, formatAppendix, format ) => {
			const formatted = format.replace( /\$\{\s*(.*?)\*(.*?)\s*\}/g, ( _, operator, alias ) => {
				const node = ANCHORS_MAP[alias]?.clone() ??
					assert.fail( `Missing alias "${alias}" in expression "${JSON.stringify( src )}"` );
				node.anchor = undefined;
				switch( operator ){
					case '':
						return stringifyYaml( node ).trim();
					case '!':
						return node.toString();

					case '...': {
						assert( node instanceof YAMLSeq );
						return node.items.map( i => stringifyYaml( i ).trim() ).join( ', ' );
					}

					default:
						throw new SyntaxError( `Unexpected operator "${operator}"` );
				}
			} );
			return `${indent}${formatted} ${formatAppendix}`;
		} );
		await syncFile( checkOnly, circleCiPath, cfgFormatted );
	},
} );
