import { fail } from 'assert';

import { readFile } from 'fs/promises';

import { parse } from 'semver';

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
export const tryReadFile = async file => {
	try{
		return await readFile( file, 'utf-8' );
	} catch( e ){
		return undefined;
	}
};

const BASE_DOCS_URL = 'https://knodescommunity.github.io/typedoc-plugins';
export const getDocsUrl = pkgJson => {
	const docsUrl = parse( pkgJson.version ).prerelease.length === 0 ?
		BASE_DOCS_URL :
		`${BASE_DOCS_URL}/v${pkgJson.version}`;
	return `${docsUrl}/modules/${( pkgJson.name ?? fail( 'No name' ) ).replace( /[^a-z0-9]/gi, '_' )}.html`;
};

export * from  './yaml.mjs';
export * from  './diff.mjs';
export * from  './package-json.mjs';
