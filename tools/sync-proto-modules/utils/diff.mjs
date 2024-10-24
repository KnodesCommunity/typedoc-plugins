import { readFile, writeFile } from 'fs/promises';

import chalk from 'chalk';
import { diffLines } from 'diff';
import _ from 'lodash';

import { relativeToRoot } from '../../utils.mjs';

const { bgGreen, bgGrey, bgRed, bold, grey } = chalk;

const linesCount = str => ( str.match( /\n/g )?.length ?? 0 ) + 1;
const formatNl = fn => ( str, newLine = true ) => fn( str === '' && newLine ? '↵' : str );

const printLineWithNo = ( { line, lineDelta, linesMaxCol }, offset, delta ) => {
	const lineE = line + ( delta !== true ? offset : 0 );
	const lineA = line + ( delta !== false ? offset : 0 ) + lineDelta;
	const lineNo = lineE === lineA ?
		_.pad( lineE.toString(), linesMaxCol * 2 + 1 ) :
		`${lineE.toString().padStart( linesMaxCol )}:${lineA.toString().padEnd( linesMaxCol )}`;
	return `${lineNo}>`;
};

const COLORS = {
	[false]: formatNl( str => bgGreen( bold( str ) ) ),
	[true]: formatNl( str => bgRed( bold( str ) ) ),
	[null]: str => grey( str ),
};
const LINES_CONTEXT = 3;

const getLinesDiff = ( { lines, color, printLine, sameLine, isAdd, totalLines0, totalDiffs, diffIndex } ) => {
	lines = lines.length <= LINES_CONTEXT * 2 ?
		lines.map( ( l, j ) => j === 0 && sameLine ? color( l ) : `${printLine( j, isAdd )} ${color( l, j < totalLines0 )}` ) :
		[
			...( diffIndex > 0 ?
				lines.slice( 0, LINES_CONTEXT ).map( ( l, j ) => j === 0 && sameLine ? color( l ) : `${printLine( j, isAdd )} ${color( l )}` ) :
				[] ),
			color( '====================================' ),
			...( diffIndex < totalDiffs - 1 ?
				lines.slice( -LINES_CONTEXT ).map( ( l, j ) => `${printLine( j + lines.length - LINES_CONTEXT, isAdd )} ${color( l )}` ) :
				[] ),
		];
	return lines.join( '\n' );
};

const errors = [];
export const assertDiffFile = async ( filename, expectedContent, invert = false ) => {
	const actualContent = await readFile( filename, 'utf-8' );

	const diff = diffLines( expectedContent, actualContent );
	if( diff.length === 1 ){
		return;
	}

	console.log( bgGrey( relativeToRoot( filename ) ) );

	let line = 1;
	let lineDelta = 0;
	let sameLine = false;
	const linesMaxCol = Math.max( linesCount( expectedContent ), linesCount( actualContent ) ).toString().length;
	diff.forEach( ( part, i ) => {
		const printLine = printLineWithNo.bind( null, { line, lineDelta, linesMaxCol } );
		const lines = part.value.split( /\n/ );
		const isAdd = part.removed ?
			invert :
			part.added ?
				!invert :
				null;
		const color = COLORS[isAdd];
		const ll = lines.length - 1;
		if( isAdd === true ){
			lineDelta += linesCount( part.value ) - 1;
		} else if( isAdd === false ){
			lineDelta -= linesCount( part.value ) - 1;
		}
		process.stdout.write( getLinesDiff( {
			color,
			diffIndex: i,
			isAdd,
			lines,
			printLine,
			sameLine,
			totalDiffs: diff.length,
			totalLines0: ll,
		} ) );
		sameLine = !lines[ll].endsWith( '\n' );
		if( isAdd !== true ){
			line += ll;
		}
	} );
	console.log();
	errors.push( new Error( `File ${filename} does not match the expected content` ) );
};
export const summarizeErrors = () => {
	if( errors.length ){
		// eslint-disable-next-line no-undef -- Actually exists
		throw new AggregateError( errors, 'Some files are incorrect' );
	}
};

export const syncFile = async ( checkOnly, filename, expectedContent ) => {
	if( checkOnly ){
		await assertDiffFile( filename, expectedContent );
	} else {
		await writeFile( filename, expectedContent );
	}
};
