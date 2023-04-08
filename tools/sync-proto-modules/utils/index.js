const assert = require( 'assert' );

const { readFile } = require( 'fs/promises' );

const SemVer = require( 'semver' );

/**
 * @typedef {import('../../utils').Project} Project
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

const BASE_DOCS_URL = 'https://knodescommunity.github.io/typedoc-plugins';
module.exports.getDocsUrl = pkgJson => {
	const docsUrl = SemVer.parse( pkgJson.version ).prerelease.length === 0 ?
		BASE_DOCS_URL :
		`${BASE_DOCS_URL}/v${pkgJson.version}`;
	return `${docsUrl}/modules/${( pkgJson.name ?? assert.fail( 'No name' ) ).replace( /[^a-z0-9]/gi, '_' )}.html`;
};

module.exports = {
	...module.exports,
	...require( './yaml' ),
	...require( './diff' ),
	...require( './package-json' ),
};
