import { readFile } from 'fs/promises';
import { resolve } from 'path';

import _ from 'lodash';

import { formatPackage, getDocsUrl, syncFile } from './utils/index.mjs';
import { resolveRoot } from '../utils.mjs';

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils/index.mjs').ProtoHandler<{getProtoPkg: (v: string) => Promise<string>, rootJson: any, rootJsonStr: string, rootPath: string}}
 */
export const packageJson = async checkOnly => ( {
	setup: async () => {
		const getProtoPkg = _.memoize( proto => readFile( resolve( proto, 'package.json' ), 'utf-8' ) );
		const rootPath = resolveRoot( 'package.json' );
		const rootJsonStr = await readFile( rootPath, 'utf-8' );
		const rootJson = JSON.parse( rootJsonStr );
		return { getProtoPkg, rootJson, rootJsonStr, rootPath };
	},
	run: async ( proto, { path: projectPath, pkgJsonPath, pkgJson }, projects, _handlers, { getProtoPkg } ) => {
		const protoPkgContent = await getProtoPkg( proto );
		const protoPkg = JSON.parse( protoPkgContent
			.replace( /\{projectRelDir\}/g, projectPath )
			.replace( /\{projectTypeDocUrl\}/g, getDocsUrl( pkgJson ) ) );
		const newProjectPkg = _.defaultsDeep( _.cloneDeep( protoPkg ), pkgJson );
		[ 'keywords', 'files' ].forEach( prop => newProjectPkg[prop] = _.uniq( [
			...( protoPkg[prop] ?? [] ),
			...( pkgJson[prop] ?? [] ),
		]
			.map( k => k.toLowerCase() ) )
			.sort() );
		await syncFile( checkOnly, pkgJsonPath, await formatPackage( newProjectPkg ) );
	},
	tearDown: async( proto, projects, _handlers, { rootJson, rootPath } ) => {
		rootJson['devDependencies'] = {
			...rootJson['devDependencies'],
			...Object.fromEntries( projects.map( p => [ p.pkgName, 'workspace:*' ] ) ),
		};
		await syncFile( checkOnly, rootPath, await formatPackage( rootJson ) );
	},
	handleFile: filename => /(\/|^)package\.json$/.test( filename ),
} );
