const { resolve } = require( 'path' );

const { SemVer } = require( 'semver' );

const { syncFile } = require( './utils/diff' );
const { formatPackage } = require( './utils/package-json' );
const { resolveRoot } = require( '../utils' );

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
 * @returns {import('./utils').ProtoHandler<ReturnType<typeof syncPkgTypedocVersion>>}
 */
module.exports.typedocSubmodule = async checkOnly => ( {
	setup: async proto => {
		const submoduleDir = resolveRoot( 'typedoc' );
		const submoduleVersion = require( resolve( submoduleDir, 'package.json' ) ).version;
		const doSync = syncPkgTypedocVersion( checkOnly, new SemVer( submoduleVersion ) );
		const protoPkgPath = resolve( proto, 'package.json' );
		const protoPkgJson = require( protoPkgPath );
		await doSync( protoPkgJson, protoPkgPath );
		return doSync;
	},
	run: async ( proto, project, projects, handlers, doSync ) => {
		const syncedPkg = await doSync( project.pkgJson, project.pkgJsonPath );
		Object.assign( project.pkgJson, syncedPkg );
	},
} );
