import { isNumber, isString } from 'lodash';
import { ProjectReflection, Reflection, ReflectionKind } from 'typedoc';

export const addReflectionKind = ( ns: string, name: string, value?: number ) => {
	const fullname = `${ns}:${name}`;

	value = value ??
		( Math.max( ...Object.values( { ...ReflectionKind, All: -1 } ).filter( isNumber ) ) * 2 );
	const kindAny = ReflectionKind as any;
	kindAny[fullname] = value;
	kindAny[value] = fullname;
	return value;
};

export const getReflectionSourceFileName = ( reflection?: Reflection ) => {
	if( !reflection ){
		return;
	}
	return reflection.sources?.[0].fileName;
};

export const getCoordinates = ( content: string, position: number ): {line: number; column: number} => {
	const beforeContent = content.slice( 0, position );
	const lines = beforeContent.split( '\n' );
	return { line: lines.length, column: lines[lines.length - 1].length + 1 };
};

export const getPageSourceCoordinates = ( reflection: Reflection | undefined, position: number ): {line: number; column: number; file: string} | undefined => {
	if( !reflection ){
		return;
	}
	const sourceRef = reflection.sources?.[0];
	if( sourceRef && reflection.comment ){
		const coordinates = getCoordinates(
			reflection instanceof ProjectReflection && reflection.readme ?
				reflection.readme :
				reflection.comment.text,
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

export const rethrow = <T>( block: () => T, newErrorFactory: ( err: any ) => string | Error ) => {
	try {
		return block();
	} catch( err ){
		const newErr = newErrorFactory( err );
		if( isString( newErr ) ){
			throw new Error( newErr );
		} else {
			throw newErr;
		}
	}
};
