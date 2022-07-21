const assert = require( 'assert' );
const { readFile } = require( 'fs/promises' );
const { resolve } = require( 'path' );

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
