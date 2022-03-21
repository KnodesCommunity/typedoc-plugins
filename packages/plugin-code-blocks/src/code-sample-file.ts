import { readFileSync } from 'fs';

import { textUtils } from '@knodes/typedoc-pluginutils';

export const DEFAULT_BLOCK_NAME = '__DEFAULT__';
const REGION_REGEX = /^[\t ]*\/\/[\t ]*#((?:end)?region)(?:[\t ]+(.*?))?$/gm;

export interface ICodeSample {
	region: string;
	file: string;
	code: string;
	startLine: number;
	endLine: number;
}

interface IRegionMarkerBase{
	fullMatch: string;
	line: number;
	type: 'start' | 'end';
	name?: string;
}
interface IStartRegionMarker extends IRegionMarkerBase {
	type: 'start';
	name: string;
}
interface IEndRegionMarker extends IRegionMarkerBase{
	type: 'end';
}
type RegionMarker = IStartRegionMarker | IEndRegionMarker

const parseRegionMarker = ( fileContent: string ) => ( match: RegExpMatchArray ): RegionMarker => {
	if( typeof match.index !== 'number' ){
		throw new Error( 'Missing index' );
	}
	const type = match[1].toLocaleLowerCase() === 'region' ? 'start' : 'end';
	const name = match[2];
	if( type === 'start' && !name ){
		throw new Error( 'Missing name of #region' );
	}
	const location = textUtils.getCoordinates( fileContent, match.index );
	return { ...location, type, name, fullMatch: match[0] };
};

const assembleStartEndMarkers = ( prevMarkers: Array<{open?: IStartRegionMarker; close?: IEndRegionMarker; name: string}>, marker: RegionMarker ) => {
	if( marker.type === 'start' ){
		if( prevMarkers.find( r => r.name === marker.name ) ) {
			throw new Error( `Region ${marker.name} already exists` );
		}
		prevMarkers.push( {
			open: marker,
			name: marker.name,
		} );
	} else {
		if( marker.name ){
			const openRegion = prevMarkers.find( r => r.name === marker.name );
			if( !openRegion ) {
				throw new Error( `Missing region ${marker.name} explicitly closed` );
			}
			if( openRegion.close ) {
				throw new Error( `Region ${marker.name} already closed` );
			}
			openRegion.close = marker;
		} else {
			const lastNotClosed = prevMarkers.concat().reverse().find( r => !r.close );
			if( !lastNotClosed ){
				throw new Error( 'Missing implicitly closed region' );
			}
			if( lastNotClosed.close ) {
				throw new Error( `Region ${lastNotClosed.name} already closed` );
			}
			lastNotClosed.close = marker;
		}
	}
	return prevMarkers;
};

interface IRegion {
	open: IStartRegionMarker;
	close: IEndRegionMarker;
	name: string;
}

const addRegionInSet = ( file: string, contentLines: string[] ) => ( regionsMap: Map<string, ICodeSample>, { open, close, name }: IRegion ) => {
	const code = contentLines.slice( open.line, close.line ).filter( l => !l.match( REGION_REGEX ) ).join( '\n' );
	regionsMap.set( name, {
		file,
		region: name,
		endLine: close.line,
		startLine: open.line,
		code,
	} );
	return regionsMap;
};

export const readCodeSample = ( file: string ): Map<string, ICodeSample> => {
	const content = readFileSync( file, 'utf-8' );
	const lines = content.split( '\n' );
	const regionMarkers = [ ...content.matchAll( REGION_REGEX ) ];

	if( regionMarkers.length === 0 ){
		return new Map( [
			[ DEFAULT_BLOCK_NAME, {
				file,
				region: DEFAULT_BLOCK_NAME,
				code: content,
				endLine: lines.length,
				startLine: 1,
			} ],
		] );
	}

	return regionMarkers
		.map( parseRegionMarker( content ) )
		.reduce( assembleStartEndMarkers, [] )
		// Check validity of regions
		.map( r => {
			if( !r.open || !r.close || r.open.line > r.close.line ){
				throw new SyntaxError( `Invalid region ${r.name}` );
			}
			return r as IRegion;
		} )
		.reduce( addRegionInSet( file, lines ), new Map<string, ICodeSample>() );
};
