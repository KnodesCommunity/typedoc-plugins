const { readFile } = require( 'fs/promises' );

const { groupBy, zip } = require( 'lodash' );
const semver = require( 'semver' );
const { parseDocument: parseYamlDocument } = require( 'yaml' );

const { syncFile, postProcessYaml } = require( './utils' );
const { resolveRoot } = require( '../utils' );

const getMinorVersionsToCheck = async () => {
	const releasesResponse = await fetch( 'https://nodejs.org/dist/index.json' );
	const releasesJson = await releasesResponse.json();
	const releasesParsed = releasesJson
		.map( release => ( { ...release, semver: semver.parse( release.version ) } ) )
		.sort( ( a, b ) => semver.compare( b.semver, a.semver ) );
	const releasesGroupedByMajor = Object.entries( groupBy( releasesParsed, release => release.semver.major ) )
		.map( ( [ major, [ latest ]] ) => ( { major: parseInt( major, 10 ), version: latest.semver, lts: !!latest.lts } ) )
		.sort( ( a, b ) => b.major - a.major );
	const lts = releasesGroupedByMajor.filter( releaseGroup => releaseGroup.lts );
	if( releasesGroupedByMajor[0].lts ){
		return { default: lts[0], other: lts.slice( 1, 3 ) };
	} else {
		return { default: lts[0], other: [ releasesGroupedByMajor[0], ...lts.slice( 1, 2 ) ] };
	}
};

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler}
 */
module.exports.circleCi = async checkOnly => ( {
	tearDown: async() => {
		const circleCiPath = resolveRoot( '.circleci/config.yml' );
		const currentCircleCi = await readFile( circleCiPath, 'utf-8' );

		const { default: defaultNodeVersionToCheck, other: otherNodeVersionsToCheck } = await getMinorVersionsToCheck();
		const doc = parseYamlDocument( currentCircleCi );
		const xParams = doc.get( 'x-params' );
		const nonDefaultCiVersions = xParams.get( 'node-version-non-default', true ).toJSON();
		const defaultCiVersion = xParams.get( 'node-version-default', true ).value;

		let alteredCircleCi = currentCircleCi;
		if( !semver.satisfies( defaultCiVersion, `~${defaultNodeVersionToCheck.version.version}` ) ){
			alteredCircleCi = alteredCircleCi.replace( /&test-matrix-nodeversion-default "\S+"/, `&test-matrix-nodeversion-default "${defaultNodeVersionToCheck.version.version}"` );
		}
		if( !zip( nonDefaultCiVersions, otherNodeVersionsToCheck )
			.every( ( [ ciVersion, nodeVersion ] ) => semver.satisfies( ciVersion, `~${nodeVersion.version.version}` ) )
		){
			alteredCircleCi = alteredCircleCi.replace(
				/&test-matrix-nodeversion-nondefault \[.*?\]/,
				`&test-matrix-nodeversion-nondefault ${JSON.stringify( otherNodeVersionsToCheck.map( v => v.version.version ) )}` );
		}

		const cfgFormatted = postProcessYaml( alteredCircleCi );
		await syncFile( checkOnly, circleCiPath, cfgFormatted );
	},
} );
