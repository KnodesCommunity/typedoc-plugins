import { readFile, writeFile } from 'fs/promises';

// eslint-disable-next-line import/no-extraneous-dependencies -- Dev tool
import glob from 'glob';

import { exec } from './utils.js';
const version = process.argv[2];

const packageFiles = glob.sync( '**/package.json', { ignore: 'node_modules/**' } );
const modifiedPackages = ( await Promise.all( packageFiles.map( async p => {
	const pkg = JSON.parse( await readFile( p, 'utf-8' ) );
	if( !pkg.version ){
		return;
	}
	// eslint-disable-next-line no-console -- Dev tool
	console.log( `Bump to ${version} in ${p}` );
	pkg.version = version;
	await writeFile( p, JSON.stringify( pkg, null, 2 ) );
	return p;
} ) ) ).filter( v => v );
await exec( 'npm run format:pkg' );
await exec( 'npm run changelog' );
await exec( `git add ${modifiedPackages.join( ' ' )} CHANGELOG.md` );
