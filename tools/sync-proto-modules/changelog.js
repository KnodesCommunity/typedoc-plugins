const { readFile, writeFile } = require( 'fs/promises' );
const { resolve } = require( 'path' );

const { isString, escapeRegExp } = require( 'lodash' );

const { resolveRoot, spawn, captureStream } = require( '../utils' );
const { syncFile, tryReadFile } = require( './utils' );

const getOldestVersion = async pkgName => {
	try {
		const out = await spawn( 'npm', [ 'show', pkgName, 'versions', '--json' ], { stdio: [ null, captureStream(), captureStream() ], shell: true } );
		const versions = JSON.parse( out.stdout );
		return versions[0];
	} catch( e ){
		if( e.code === 1 && e.stderr.match( new RegExp( `404\\s+'${escapeRegExp( pkgName )}@latest' is not in this registry.` ) ) ){
			return null;
		}
		throw e;
	}
};

const reformatChangelogLines = ( thisProjectId, packagesIds ) => l => {
	const match = l.match( /^\* (?:\*\*(.*?)\*\*: )?(.*)/ );
	if( !match ){
		return l;
	}
	const [ , scope, right ] = match;
	if( scope === thisProjectId ){
		return `* ${right}`;
	}
	if( !scope ){
		return `* **monorepo**: ${right}`;
	}
	const depPkg = packagesIds.find( p => p.id === scope );
	if( !depPkg ) {
		return l;
	}
	if( depPkg.isDep ){
		return `* **dep: ${depPkg.pkgName}**: ${right}`;
	}
};

class Changelog {
	constructor( checkOnly ){
		this.checkOnly = checkOnly;
	}

	async setup( _, projects ){
		return {
			changelog: ( await readFile( resolve( __dirname, '../../CHANGELOG.md' ), 'utf-8' ) ).split( '\n' ),
			oldestVersionCache: await this._getVersionsCache( projects ),
		};
	}

	async run( _, project, projects, ___, { changelog: fullChangelogStrs, oldestVersionCache } ){
		const { pkgName, pkgJson, id, path } = project;
		const packagesIds = projects.map( p => ( { isDep: p.pkgName in ( pkgJson.dependencies ?? {} ), ...p } ) );
		const pkgChangelogFull = fullChangelogStrs
			.map( reformatChangelogLines( id, packagesIds ) )
			.filter( isString )
			.join( '\n' )
			.replace( /^### .*(\n*)^(?=#)/gm, '' )
			.replace( /^(## .*)(\n*)^(?=##)/gm, '$1\n\n\nNo notable changes were done in this version.\n\n\n' )
			.replace( /\n{4,}/g, '\n\n\n' );
		const firstVersion = oldestVersionCache[pkgName];
		const pkgChangelogFromFirstVersion = firstVersion ?
			pkgChangelogFull.replace(
				new RegExp( `(\n## .*\\W?${escapeRegExp( firstVersion )}\\W.*)\n((?:.|\n)*?\n)(## (.|\n)*)$` ),
				'$1\n\n\n**First release**\n$2' ) :
			pkgChangelogFull;
		const changelogPath = resolveRoot( path, 'CHANGELOG.md' );
		await syncFile( this.checkOnly, changelogPath, `${pkgChangelogFromFirstVersion.trim()  }\n` );
	}

	tearDown( _, __, ___, { oldestVersionCache } ){
		return writeFile( resolve( __dirname, '.changelog-cache.json' ), JSON.stringify( oldestVersionCache, null, 4 ), 'utf-8' );
	}

	async _getVersionsCache( projects ) {
		const prevVersionsCache = Object.assign(
			Object.fromEntries( projects.filter( p => p.pkgJson.private ).map( p => [ p.pkgName, '0.0.0' ] ) ),
			JSON.parse( await tryReadFile( resolve( __dirname, '.changelog-cache.json' ) ) ?? '{}' ) );
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
 * @returns {import('./utils').ProtoHandler<{changelog: string[], oldestVersionCache: Record<string, string|undefined>>}
 */
module.exports.changelog = async checkOnly => new Changelog( checkOnly );
