const { readFile, writeFile } = require( 'fs/promises' );
const { resolve } = require( 'path' );

const { isString, escapeRegExp } = require( 'lodash' );

const { resolveRoot, spawn, captureStream } = require( '../utils' );
const { syncFile, tryReadFile } = require( './utils' );

const getOldestVersion = async pkgName => {
	try {
		const out = await spawn( 'npm', [ 'show', pkgName, 'versions', '--json' ], { stdio: [ null, captureStream(), captureStream() ] } );
		const versions = JSON.parse( out.stdout );
		return versions[0];
	} catch( e ){
		if( e.code === 1 && e.stderr.match( new RegExp( `404\\s+'${escapeRegExp( pkgName )}@latest' is not in this registry.` ) ) ){
			return null;
		}
		throw e;
	}
};

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler<{changelog: string[], oldestVersionCache: Record<string, string|undefined>>}
 */
module.exports.changelog = async checkOnly => ( {
	setup: async ( _, projects ) => ( {
		changelog: ( await readFile( resolve( __dirname, '../../CHANGELOG.md' ), 'utf-8' ) ).split( '\n' ),
		oldestVersionCache: Object.assign(
			Object.fromEntries( projects.filter( p => p.pkgJson.private ).map( p => [ p.pkgName, '0.0.0' ] ) ),
			JSON.parse( await tryReadFile( resolve( __dirname, '.changelog-cache.json' ) ) ?? '{}' ),
		),
	} ),
	run: async ( _, project, projects, ___, { changelog: fullChangelogStrs, oldestVersionCache } ) => {
		const { path, pkgJson, pkgName, id } = project;
		if( !( pkgName in oldestVersionCache ) ){
			oldestVersionCache[pkgName] = await getOldestVersion( pkgName );
			if( !oldestVersionCache[pkgName] ){
				delete oldestVersionCache[pkgName];
			}
		}
		const packagesIds = projects.map( p => ( { isDep: p.pkgName in ( pkgJson.dependencies ?? {} ), ...p } ) );
		const pkgChangelogFull = fullChangelogStrs
			.map( l => {
				const match = l.match( /^\* (?:\*\*(.*?)\*\*: )?(.*)/ );
				if( match ){
					const [ , scope, right ] = match;
					if( scope === id ){
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
				} else {
					return l;
				}
			} )
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
		await syncFile( checkOnly, changelogPath, `${pkgChangelogFromFirstVersion.trim()  }\n` );
	},
	tearDown: ( _, __, ___, { oldestVersionCache } ) => writeFile( resolve( __dirname, '.changelog-cache.json' ), JSON.stringify( oldestVersionCache, null, 4 ), 'utf-8' ),
} );
