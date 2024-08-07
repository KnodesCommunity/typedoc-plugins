import { equal } from 'assert';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

import { gt, minVersion, parse } from 'semver';

import { captureStream, spawn } from './utils.mjs';

const dirname = fileURLToPath( new URL( '.', import.meta.url ) );
const packageJson = JSON.parse( await readFile( resolve( dirname, '../package.json' ) ) );
const { devDependencies, version } = packageJson;

const typedocVersionStr = devDependencies.typedoc;
const selfVersionStr = version;

const doAlpha = process.argv[2];
if( doAlpha ){
	equal( doAlpha, '--alpha' );
}

const typedocVersion = minVersion( typedocVersionStr );
const selfVersion = parse( selfVersionStr );
let nextVersion;

const isVersionUsed = async versionToCheck => {
	try {
		const output = await spawn( 'git', [ 'rev-parse', `tags/v${versionToCheck.format()}` ], { stdio: [ null, captureStream(), captureStream() ] } );
		console.error( `Version v${versionToCheck.format()} is already tagged as ${output.stdout.trim()}` );
		return true;
	} catch( error ){
		if( error.code === 128 ){
			return false;
		}
		throw error;
	}
};
if( gt( `${typedocVersion.major}.${typedocVersion.minor}.0`, `${selfVersion.major}.${selfVersion.minor}.0` ) ){
	nextVersion = parse( `${typedocVersion.major}.${typedocVersion.minor}.0` );
	if( doAlpha ){
		do {
			nextVersion = nextVersion.inc( 'prepatch' );
		} while ( await isVersionUsed( nextVersion ) );
	}
} else if( selfVersion.prerelease && doAlpha ){
	do {
		nextVersion = selfVersion.inc( 'prerelease', 'next' );
	} while ( await isVersionUsed( nextVersion ) );
} else {
	nextVersion = selfVersion.inc( 'patch' );
}

console.log( nextVersion.format() );
