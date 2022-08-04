import { isNumber } from 'lodash';
import { ProjectReflection, Reflection, SourceReference, normalizePath } from 'typedoc';

import { PluginAccessor, getApplication, getPlugin } from '../base-plugin';
import { getCoordinates } from './text';

export const getReflectionSourceFileName = ( reflection?: Reflection ) => {
	if( !reflection ){
		return;
	}
	return reflection.sources?.[0].fullFileName;
};
export const getPageSourceCoordinates = ( reflection: Reflection | undefined, position: number ): {line: number; column: number; file: string} | undefined => {
	if( !reflection ){
		return;
	}
	const sourceRef = reflection.sources?.[0];
	if( sourceRef && reflection.comment ){
		const coordinates = getCoordinates(
			( reflection instanceof ProjectReflection && reflection.readme ?
				reflection.readme :
				reflection.comment.summary )[0].text,
			position );
		return {
			...coordinates,
			line: sourceRef.line + coordinates.line - 1,
			file: sourceRef.fileName,
		};
	}
	return undefined;
};

export const getSourceLocationBestClue = ( reflection?: Reflection, position?: number ) => {
	const pageSourceCoordinates = isNumber( position ) ? getPageSourceCoordinates( reflection, position ) : undefined;
	if( pageSourceCoordinates ){
		return `${pageSourceCoordinates.file}:${pageSourceCoordinates.line}:${pageSourceCoordinates.column}`;
	} else {
		return getReflectionSourceFileName( reflection ) ?? 'UNKNOWN SOURCE';
	}
};

export const createSourceReference = ( pluginAccessor: PluginAccessor, absoluteFilename: string, line?: number, character?: number ) => {
	const source = new SourceReference( normalizePath( absoluteFilename ), line ?? 1, character ?? 1 );
	source.fileName = getPlugin( pluginAccessor ).relativeToRoot( absoluteFilename );
	const repo = ( getApplication( pluginAccessor ).converter.getComponent( 'source' ) as any )?.getRepository( source.fullFileName );
	source.url = repo?.getURL( source.fullFileName );
	if ( source.url && repo ) {
		source.url += `#${repo.getLineNumberAnchor(
			source.line,
		)}`;
	}
	return source;
};
