import { readdirSync } from 'fs';

import { sync as findUpSync } from 'find-up';
import { DeclarationReflection, UrlMapping } from 'typedoc';

import { dirname, resolve } from '@knodes/typedoc-pluginutils/path';

const getModuleReflectionSource = ( reflection: DeclarationReflection ) => reflection.sources?.[0]?.fullFileName;

const findReadmeInDir = ( dir: string, readmeFile: string[] ) => readdirSync( dir ).find( f => readmeFile.includes( f.toLowerCase() ) );

/**
 * Try to resoluve the README file in the directory of the module's `package.json`.
 *
 * @param readmeTargets - A list of file names to look up to locate packages root.
 * @param moduleMapping - The module URL mapping.
 * @param readmeCandidates - A list of files to use as readme. The first found is used. File names are NOT case sensitive. Example: `["readme-typedoc.md", "readme.md"]`. Defaults to `["readme.md"]`.
 * @returns the relative & absolute path of the readme.
 */
export const findReadmeFile = ( readmeTargets: string[], moduleMapping: UrlMapping<DeclarationReflection>, readmeCandidates?: string[] ) => {
	if( !readmeCandidates ){
		readmeCandidates = [];
	}
	if( readmeCandidates.length === 0 ) {
		readmeCandidates.push( 'readme.md' );
	}
	readmeCandidates = readmeCandidates.map( r => r.toLowerCase() );
	const src = getModuleReflectionSource( moduleMapping.model );
	if( !src ){
		return;
	}
	let targetFile;
	for ( const target of readmeTargets ) {
		targetFile = findUpSync( target, { cwd: dirname( src ) } );
		if ( !targetFile ){
			continue;
		}
		const pkgDir = dirname( targetFile );
		const readmeFile = findReadmeInDir( pkgDir, readmeCandidates );

		if( readmeFile ){
			const absReadmeFile = resolve( pkgDir, readmeFile );
			return {
				relative: readmeFile,
				absolute: absReadmeFile,
			};
		}
	}
};
