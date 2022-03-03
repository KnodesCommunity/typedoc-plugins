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
		.map<RegionMarker>( m => {
			if( typeof m.index !== 'number' ){
				throw new Error( 'Missing index' );
			}
			const type = m[1].toLocaleLowerCase() === 'region' ? 'start' : 'end';
			const name = m[2];
			if( type === 'start' && !name ){
				throw new Error( 'Missing name of #region' );
			}
			const location = textUtils.getCoordinates( content, m.index );
			return { ...location, type, name, fullMatch: m[0] };
		} )
		.reduce( ( acc, marker ) => {
			if( marker.type === 'start' ){
				if( acc.find( r => r.name === marker.name ) ) {
					throw new Error( `Region ${marker.name} already exists` );
				}
				acc.push( {
					open: marker,
					name: marker.name,
				} );
			} else {
				if( marker.name ){
					const openRegion = acc.find( r => r.name === marker.name );
					if( !openRegion ) {
						throw new Error( `Missing region ${marker.name} explicitly closed` );
					}
					if( openRegion.close ) {
						throw new Error( `Region ${marker.name} already closed` );
					}
					openRegion.close = marker;
				} else {
					const lastNotClosed = acc.concat().reverse().find( r => !r.close );
					if( !lastNotClosed ){
						throw new Error( 'Missing implicitly closed region' );
					}
					if( lastNotClosed.close ) {
						throw new Error( `Region ${lastNotClosed.name} already closed` );
					}
					lastNotClosed.close = marker;
				}
			}
			return acc;
		}, [] as Array<{open?: IStartRegionMarker; close?: IEndRegionMarker; name: string}> )
		// Check validity of regions
		.map( r => {
			if( !r.open || !r.close || r.open.line > r.close.line ){
				throw new SyntaxError( `Invalid region ${r.name}` );
			}
			return r as {open: IStartRegionMarker; close: IEndRegionMarker; name: string};
		} )
		.reduce( ( acc, { open, close, name } ) => {
			const code = lines.slice( open.line, close.line ).filter( l => !l.match( REGION_REGEX ) ).join( '\n' );
			acc.set( name, {
				file,
				region: name,
				endLine: close.line,
				startLine: open.line,
				code,
			} );
			return acc;
		}, new Map<string, ICodeSample>() );
};
