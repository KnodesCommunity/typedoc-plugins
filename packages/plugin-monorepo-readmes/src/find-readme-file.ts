import { readdirSync, existsSync } from 'fs';
import { dirname, resolve, join } from 'path';

import { sync as findUpSync } from 'find-up';
import { DeclarationReflection, UrlMapping } from 'typedoc';

const getModuleReflectionSource = ( reflection: DeclarationReflection ) => {
	for( const source of reflection.sources ?? [] ) {
		if( source.file ){
			return source.file?.fullFileName;
		}
	}
	return undefined;
};

/**
 * Try to resoluve the README file in the directory of the module's `package.json`.
 *
 * @param readmeTargets - A list of file names to look up to locate packages root.
 * @param moduleMapping - The module URL mapping.
 * @returns the relative & absolute path of the readme.
 */
export const findReadmeFile = ( readmeTargets: string[], moduleMapping: UrlMapping<DeclarationReflection>, readme: string[] ) => {
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
		const readmeFile = (() => {
			if (readme?.length) { 
				for (const name of readme) {
					if (existsSync(join(pkgDir, name)))
						return name;
				}
				return;
			}
			return readdirSync( pkgDir ).find( f => f.toLowerCase() === 'readme.md' );
		})();

		if( readmeFile ){
			const absReadmeFile = resolve( pkgDir, readmeFile );
			return {
				relative: readmeFile,
				absolute: absReadmeFile,
			};
		}
	}
};
