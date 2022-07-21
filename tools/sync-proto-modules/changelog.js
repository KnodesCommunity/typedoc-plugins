const { readFile } = require( 'fs/promises' );
const { resolve } = require( 'path' );

const { isString } = require( 'lodash' );

const { resolveRoot } = require( '../utils' );
const { syncFile } = require( './utils' );

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler<string[]>}
 */
module.exports.changelog = async checkOnly => ( {
	setup: async () => ( await readFile( resolve( __dirname, '../../CHANGELOG.md' ), 'utf-8' ) ).split( '\n' ),
	run: async ( _, project, projects, ___, fullChangelogStrs ) => {
		const { path, pkgJson, id } = project;
		const packagesIds = projects.map( p => ( { isDep: p.pkgName in ( pkgJson.dependencies ?? {} ), ...p } ) );
		const pkgChangelog = fullChangelogStrs
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
		await syncFile( checkOnly, resolveRoot( path, 'CHANGELOG.md' ), pkgChangelog );
	},
} );
