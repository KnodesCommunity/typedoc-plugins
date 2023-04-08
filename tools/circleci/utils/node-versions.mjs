import _ from 'lodash';
import semver from 'semver';

const getMinorVersionsToCheck = async () => {
	const releasesResponse = await fetch( 'https://nodejs.org/dist/index.json' );
	const releasesJson = await releasesResponse.json();
	const releasesParsed = releasesJson
		.map( release => ( { ...release, semver: semver.parse( release.version ) } ) )
		.sort( ( a, b ) => semver.compare( b.semver, a.semver ) );
	const releasesGroupedByMajor = Object.entries( _.groupBy( releasesParsed, release => release.semver.major ) )
		.map( ( [ major, [ latest ]] ) => ( { major: parseInt( major, 10 ), version: latest.semver, lts: !!latest.lts } ) )
		.sort( ( a, b ) => b.major - a.major );
	const lts = releasesGroupedByMajor.filter( releaseGroup => releaseGroup.lts );

	const extractVersion = v => v.version.version;
	if( releasesGroupedByMajor[0].lts ){
		return {
			default: extractVersion( lts[0] ),
			other: lts.slice( 1, 3 ).map( extractVersion ),
		};
	} else {
		return {
			default: extractVersion( lts[0] ),
			other: [ releasesGroupedByMajor[0], ...lts.slice( 1, 2 ) ].map( extractVersion ),
		};
	}
};

const nodeVersions = await getMinorVersionsToCheck();

export const { default: defaultNodeVersion, other: otherNodeVersions } = nodeVersions;
export const allNodeVersions = [ nodeVersions.default, ...nodeVersions.other ];
