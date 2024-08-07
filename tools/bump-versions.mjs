import assert from 'assert';
import { readFile, writeFile } from 'fs/promises';

import { sync as globSync } from 'glob';

import { exec, spawn } from './utils.mjs';
const version = process.argv[2];
assert( version );
const depRange = `~${version}`;

const packageFiles = [
	...globSync( './packages/*/package.json', { ignore: [ '**/node_modules/**', './typedoc/' ] } ),
	'package.json',
];
const packages = ( await Promise.all( packageFiles.map( async file => {
	try {
		const pkgContent = JSON.parse( await readFile( file, 'utf-8' ) );
		if( !pkgContent.version ){
			return;
		}
		return {
			file,
			pkg: pkgContent,
		};
	} catch( e ){
		throw new Error( `Error while reading ${file}:\n${e.message}` );
	}
} ) ) )
	.filter( v => v );

packages.forEach( async ( { pkg } ) => {
	pkg.version = version;
} );
packages.filter( ( { file } ) => file !== 'package.json' ).forEach( ( { pkg, file } ) => {
	const modifiedDeps = {};
	[ 'peerDependencies', 'devDependencies', 'dependencies' ].forEach( k => {
		packages.map( p => p.pkg.name ).forEach( n => {
			if( pkg[k]?.[n] ){
				if( !modifiedDeps[k] ){
					modifiedDeps[k] = [];
				}
				modifiedDeps[k].push( n );
				pkg[k][n] = depRange;
			}
		} );
	} );
	console.log( `Bump to ${version} in ${file} along with deps ${JSON.stringify( modifiedDeps )}` );
} );

await Promise.all( packages.map( async ( { pkg, file } ) => {
	await writeFile( file, JSON.stringify( pkg, null, 2 ) );
} ) );

await spawn( 'pnpm', [ 'run', 'format:pkg', ...packageFiles ] );
await exec( 'pnpm run changelog' );

// Remove duplicate bump versions
const changelogContent = await readFile( 'CHANGELOG.md', 'utf-8' );
const replacedChangelogContent = changelogContent.split( /^## \[/m )
	.map( section => section.split( /\n/ ).filter( ( line, index, lines ) => {
		const match = line.match( /^\* \*\*deps:\*\* update dependency .*? to/ );
		if( !match ){
			return true;
		}
		return lines.findIndex( otherLine => otherLine.startsWith( match[0] ) ) === index;
	} ).join( '\n' ) )
	.join( '## [' ).trimStart();
await writeFile( 'CHANGELOG.md', replacedChangelogContent );

await spawn( 'git', [ 'add', ...packageFiles, 'CHANGELOG.md' ] );
