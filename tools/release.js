const { readFile, writeFile } = require( 'fs/promises' );

const glob = require( 'glob' );

const { exec } = require( './utils.js' );
const version = process.argv[2];
const depRange = `~${version}`;

const packageFiles = glob.sync( '**/package.json', { ignore: 'node_modules/**' } );
( async () => {
	const packages = ( await Promise.all( packageFiles.map( async file => {
		const pkgContent = JSON.parse( await readFile( file, 'utf-8' ) );
		if( !pkgContent.version ){
			return;
		}
		return {
			file,
			pkg: pkgContent,
		};
	} ) ) )
		.filter( v => v );
	await Promise.all( packages.map( async ( { pkg, file } ) => {
		pkg.version = version;
		const modifiedDeps = {};
		[ 'peerDependencies', 'devDependencies', 'dependencies' ].forEach( k => {
			packages.map( p => p.pkg.name ).forEach( n => {
				if( pkg[k][n] ){
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
	await exec( 'npm run format:pkg' );
	await exec( 'npm run changelog' );
	await exec( `git add ${packages.map( p => p.file ).join( ' ' )} CHANGELOG.md` );
} )();
