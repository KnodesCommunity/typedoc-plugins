const assert = require( 'assert' );

const semver = require( 'semver' );

const packageLock = require( '../package-lock.json' );
const pkg = require( '../package.json' );

const typedocVersionStr = packageLock.dependencies.typedoc.version;
const selfVersionStr = pkg.version;

const doAlpha = process.argv[2];
if( doAlpha ){
	assert.equal( doAlpha, '--alpha' );
}

const typedocVersion = semver.parse( typedocVersionStr );
const selfVersion = semver.parse( selfVersionStr );
let nextVersion;
if( semver.gt( `${typedocVersion.major}.${typedocVersion.minor}.0`, `${selfVersion.major}.${selfVersion.minor}.0` ) ){
	nextVersion = semver.parse( `${typedocVersion.major}.${typedocVersion.minor}.0` );
	if( doAlpha ){
		nextVersion = nextVersion.inc( 'prepatch' );
	}
} else if( selfVersion.prerelease && doAlpha ){
	nextVersion = selfVersion.inc( 'prerelease', 'next' );
} else {
	nextVersion = selfVersion.inc( 'patch' );
}

console.log( nextVersion.format() );
