import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

import _ from 'lodash';

import { syncFile, tryReadFile } from './utils/index.mjs';
import { captureStream, resolveRoot, spawn } from '../utils.mjs';

const getOldestVersion = async pkgName => {
	try {
		const out = await spawn( 'npm', [ 'show', pkgName, 'versions', '--json' ], { stdio: [ null, captureStream(), captureStream() ], shell: true } );
		const versions = JSON.parse( out.stdout );
		return versions[0];
	} catch( e ){
		if( e.code === 1 && e.stderr.match( new RegExp( `404\\s+'${_.escapeRegExp( pkgName )}@latest' is not in this registry.` ) ) ){
			return null;
		}
		throw e;
	}
};

const reformatChangelogLines = ( thisProjectId, packagesIds ) => l => {
	const match = l.match( /^\* (?:\*\*(.+?):\*\* )?(.*)$/ );
	if( !match ){
		return l;
	}
	const [ , scope, right ] = match;
	if( scope === 'plugin-monorepo-readmes' ){
		return;
	}
	if( scope === thisProjectId ){
		return `* ${right}`;
	}
	if( !scope ){
		return `* **monorepo:** ${right}`;
	}
	const depPkg = packagesIds.find( p => p.id === scope );
	if( !depPkg ) {
		return l;
	}
	if( depPkg.isDep ){
		return `* **dep: ${depPkg.pkgName}:** ${right}`;
	}
};

class Changelog {
	constructor( checkOnly ){
		this.checkOnly = checkOnly;
	}

	async setup( _proto, projects ){
		return {
			changelog: ( await readFile(
				resolve(
					fileURLToPath( new URL( '.', import.meta.url ) ),
					'../../CHANGELOG.md' ),
				'utf-8' )
			).split( '\n' ),
			oldestVersionCache: await this._getVersionsCache( projects ),
		};
	}

	async run( _proto, project, projects, _handlers, { changelog: fullChangelogStr, oldestVersionCache } ){
		const { pkgName, pkgJson, id, path } = project;
		const packagesIds = projects.map( p => ( { isDep: p.pkgName in ( pkgJson.dependencies ?? {} ), ...p } ) );
		const pkgChangelogFull = fullChangelogStr
			.map( reformatChangelogLines( id, packagesIds ) )
			.filter( _.isString )
			.join( '\n' )
			.replace( /^### .*(\n*)^(?=##)/gm, '' )
			.replace( /^(## .*)(\n*)^(?=## )/gm, '$1\n\n\nNo notable changes were done in this version.\n\n\n' )
			.replace( /\n{4,}/g, '\n\n\n' );
		const firstVersion = oldestVersionCache[pkgName];
		const pkgChangelogFromFirstVersion = firstVersion ?
			pkgChangelogFull.replace(
				new RegExp( `(\n## .*\\W?${_.escapeRegExp( firstVersion )}\\W.*)\n((?:.|\n)*?\n)(## (.|\n)*)$` ),
				'$1\n\n\n**First release**\n$2' ) :
			pkgChangelogFull;
		const changelogPath = resolveRoot( path, 'CHANGELOG.md' );
		await syncFile( this.checkOnly, changelogPath, `${pkgChangelogFromFirstVersion.trim()  }\n` );
	}

	tearDown( _proto, _projects, _handlers, { oldestVersionCache } ){
		return writeFile(
			resolve(
				fileURLToPath( new URL( '.', import.meta.url ) ),
				'.changelog-cache.json' ),
			JSON.stringify( oldestVersionCache, null, 4 ), 'utf-8' );
	}

	async _getVersionsCache( projects ) {
		const prevVersionsCache = Object.assign(
			Object.fromEntries( projects.filter( p => p.pkgJson.private ).map( p => [ p.pkgName, '0.0.0' ] ) ),
			JSON.parse( await tryReadFile( resolve( fileURLToPath( new URL( '.', import.meta.url ) ), '.changelog-cache.json' ) ) ?? '{}' ) );
		await Promise.all( projects.map( async ( { pkgJson, pkgName } ) => {
			if( pkgJson.changelogStartsAt ){
				prevVersionsCache[pkgName] = pkgJson.changelogStartsAt;
			}
			if( !( pkgName in prevVersionsCache ) ){
				prevVersionsCache[pkgName] = await getOldestVersion( pkgName );
				if( !prevVersionsCache[pkgName] ){
					delete prevVersionsCache[pkgName];
				}
			}
		} ) );
		return prevVersionsCache;
	}
}

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils/index.mjs').ProtoHandler<{changelog: string[], oldestVersionCache: Record<string, string|undefined>>}
 */
export const changelog = async checkOnly => new Changelog( checkOnly );
