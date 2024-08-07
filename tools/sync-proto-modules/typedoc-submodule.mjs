import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { SemVer } from 'semver';

import { syncFile } from './utils/diff.mjs';
import { formatPackage } from './utils/package-json.mjs';
import { resolveRoot } from '../utils.mjs';

/**
 * @param {boolean} checkOnly
 * @param {SemVer} version
 * @returns {<T extends {}>(pkg: T, path: string) => Promise<T>}
 */
const syncPkgTypedocVersion = ( checkOnly, version ) => async ( pkg, path ) => {
	if( 'typedoc' in pkg.dependencies ){
		pkg.dependencies.typedoc = `^${version.major}.${version.minor}.0`;
	}
	if( 'typedoc' in pkg.peerDependencies ){
		pkg.peerDependencies.typedoc = `^${version.major}.${version.minor}.0`;
	}
	if( 'typedoc' in pkg.devDependencies ){
		pkg.devDependencies.typedoc = `^${version.format()}`;
	}
	await syncFile( checkOnly, path, await formatPackage( pkg ) );
	return pkg;
};

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils/index.mjs').ProtoHandler<ReturnType<typeof syncPkgTypedocVersion>>}
 */
export const typedocSubmodule = async checkOnly => ( {
	setup: async proto => {
		const submodulePkgPath = resolveRoot( 'typedoc', 'package.json' );
		const submoduleVersion = JSON.parse( await readFile( submodulePkgPath, 'utf-8' ) ).version;
		const doSync = syncPkgTypedocVersion( checkOnly, new SemVer( submoduleVersion ) );
		const protoPkgPath = resolve( proto, 'package.json' );
		const protoPkgJson = JSON.parse( await readFile( protoPkgPath, 'utf-8' ) );
		await doSync( protoPkgJson, protoPkgPath );
		return doSync;
	},
	run: async ( proto, project, projects, handlers, doSync ) => {
		const syncedPkg = await doSync( project.pkgJson, project.pkgJsonPath );
		Object.assign( project.pkgJson, syncedPkg );
	},
} );
