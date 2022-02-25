const semver = require( 'semver' );

const packageLock = require( '../package-lock.json' );
const pkg = require( '../package.json' );

const typedocVersionStr = packageLock.default.dependencies.typedoc.version;
const selfVersionStr = pkg.default.version;

const typedocVersion = semver.parse( typedocVersionStr );
const selfVersion = semver.parse( selfVersionStr );
if( semver.gt( `${typedocVersion.major}.${typedocVersion.minor}.0`, `${selfVersion.major}.${selfVersion.minor}.0` ) ){
	// eslint-disable-next-line no-console -- next version to stdout
	console.log( `${typedocVersion.major}.${typedocVersion.minor}.0` );
} else {
	// eslint-disable-next-line no-console -- next version to stdout
	console.log( selfVersion.inc( 'patch' ).format() );
}
