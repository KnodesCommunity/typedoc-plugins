import { DeclarationReflection, Reflection, SourceReference } from 'typedoc';

import { normalize } from './path';
import { PluginAccessor, getApplication, getPlugin } from '../base-plugin';

export const getReflectionSourceFileName = ( reflection?: Reflection ) => {
	if( !reflection || !( reflection instanceof DeclarationReflection ) ){
		return;
	}
	return reflection.sources?.[0].fullFileName;
};

export const createSourceReference = ( pluginAccessor: PluginAccessor, absoluteFilename: string, line?: number, character?: number ) => {
	const source = new SourceReference( normalize( absoluteFilename ), line ?? 1, character ?? 1 );
	source.fileName = getPlugin( pluginAccessor ).relativeToRoot( absoluteFilename );
	const repo = ( getApplication( pluginAccessor ).converter.getComponent( 'source' ) as any )?.getRepository( source.fullFileName );
	source.url = repo?.getURL( source.fullFileName, source.line );
	return source;
};
