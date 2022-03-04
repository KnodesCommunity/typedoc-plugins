const assert = require( 'assert' );
const { readFile, writeFile } = require( 'fs/promises' );

const glob = require( 'glob' );

const { exec, spawn } = require( './utils.js' );
const version = process.argv[2];
assert( version );
const depRange = `~${version}`;

const packageFiles = [
	...glob.sync( './packages/*/package.json', { ignore: [ '**/node_modules/**', './typedoc/' ] } ),
	'package.json',
];
( async () => {
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
	await Promise.all( packages.map( async ( { pkg, file } ) => {
		pkg.version = version;
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
		await writeFile( file, JSON.stringify( pkg, null, 2 ) );
	} ) );

	await spawn( 'npm', [ 'run', 'format:pkg', ...packageFiles ] );
	await exec( 'npm run changelog' );
	await spawn( 'git', [ 'add', ...packageFiles, 'CHANGELOG.md' ] );
} )();
