const assert = require( 'assert' );

const { readFile, writeFile } = require( 'fs/promises' );
const { resolve } = require( 'path' );

const { bgRed, bgGreen, grey, bold } = require( 'chalk' );
const Diff = require( 'diff' );
const { pad, isArray } = require( 'lodash' );
const { parseDocument: parseYamlDocument, visit, stringify: stringifyYaml, YAMLSeq } = require( 'yaml' );

/**
 * @typedef {import('../utils').Project} Project
 */
/**
 * @template [T=void]
 * @typedef {{
 * 	setup?: (proto: string; projects: Project[], handlers: ProtoHandler[]) => Promise<T>;
 * 	tearDown?: (proto: string; projects: Project[], handlers: ProtoHandler[], setupRet: T) => Promise<void>;
 * 	run?: (proto: string; project: Project, projects: Project[], handlers: ProtoHandler[], setupRet: T) => Promise<void>;
 * }} ProtoHandler
 */

/**
 * @param {string} file
 */
module.exports.tryReadFile = async file => {
	try{
		return await readFile( file, 'utf-8' );
	} catch( e ){
		return undefined;
	}
};

const linesCount = str => ( str.match( /\n/g )?.length ?? 0 ) + 1;
const formatNl = fn => ( str, newLine = true ) => fn( str === '' && newLine ? '↵' : str );

module.exports.assertDiffFile = async ( filename, expectedContent, invert = false ) => {
	const actualContent = await readFile( filename, 'utf-8' );

	const diff = Diff.diffWords( expectedContent, actualContent );
	if( diff.length === 1 ){
		return;
	}

	const linesContext = 3;
	let line = 1;
	let lineDelta = 0;
	let sameLine = false;
	const linesMaxCol = Math.max( linesCount( expectedContent ), linesCount( actualContent ) ).toString().length;
	const printLine = ( offset, delta ) => {
		const lineE = line + ( delta !== true ? offset : 0 );
		const lineA = line + ( delta !== false ? offset : 0 ) + lineDelta;
		const lineNo = lineE === lineA ?
			pad( lineE.toString(), linesMaxCol * 2 + 1 ) :
			`${lineE.toString().padStart( linesMaxCol )}:${lineA.toString().padEnd( linesMaxCol )}`;
		return `${lineNo}>`;
	};
	diff.forEach( ( part, i ) => {
		const lines = part.value.split( /\n/ );
		const isChange = part.added || part.removed;
		const isAdd = isChange ?
			part.removed ?
				invert :
				part.added ?
					!invert :
					null :
			null;
		const color = ( {
			[false]: formatNl( str => bgGreen( bold( str ) ) ),
			[true]: formatNl( str => bgRed( bold( str ) ) ),
			[null]: str => grey( str ),
		} )[isAdd];
		const ll = lines.length - 1;
		const linesDiff = lines.length <= linesContext * 2 ?
			lines.map( ( l, j ) => j === 0 && sameLine ? color( l ) : `${printLine( j, isAdd )} ${color( l, j < ll )}` ) :
			[
				...( i > 0 ? lines.slice( 0, linesContext ).map( ( l, j ) => j === 0 && sameLine ? color( l ) : `${printLine( j, isAdd )} ${color( l )}` ) : [] ),
				color( '====================================' ),
				...( i < diff.length - 1 ? lines.slice( -linesContext ).map( ( l, j ) => `${printLine( j + lines.length - linesContext, isAdd )} ${color( l )}` ) : [] ),
			];
		if( isAdd === true ){
			lineDelta += linesCount( part.value ) - 1;
		} else if( isAdd === false ){
			lineDelta -= linesCount( part.value ) - 1;
		}
		process.stdout.write( linesDiff.join( '\n' ) );
		sameLine = !lines[lines.length - 1].endsWith( '\n' );
		if( isAdd !== true ){
			line += lines.length - 1;
		}
	} );
	console.log();
	throw new Error( `File ${filename} does not match the expected content` );
};

module.exports.syncFile = async ( checkOnly, filename, expectedContent ) => {
	if( checkOnly ){
		await module.exports.assertDiffFile( filename, expectedContent );
	} else {
		await writeFile( filename, expectedContent );
	}
};

module.exports.getDocsUrl = pkgJson => `https://knodescommunity.github.io/typedoc-plugins/modules/${( pkgJson.name ?? assert.fail( 'No name' ) ).replace( /[^a-z0-9]/gi, '_' )}.html`;

module.exports.readProjectPackageJson = async projectPath => {
	const projectPkgPath = resolve( projectPath, 'package.json' );
	const content = await module.exports.tryReadFile( projectPkgPath );
	if( content ){
		return {
			packageContent: JSON.parse( content ),
			path: projectPkgPath,
		};
	} else {
		return {
			packageContent: undefined,
			path: projectPkgPath,
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
	const resolveRef = ( ref, src ) => {
		if( ref.startsWith( '*' ) ){
			const node = ANCHORS_MAP[ref.slice( 1 )]?.clone() ??
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
