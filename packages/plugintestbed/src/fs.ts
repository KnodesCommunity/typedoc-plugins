import * as fs from 'fs';

import { Volume } from 'memfs';
import { NestedDirectoryJSON } from 'memfs/lib/volume';
import { Union } from 'unionfs';

// eslint-disable-next-line @typescript-eslint/no-var-requires -- No typings
const { patchFs } = require( 'fs-monkey' );

let cleanupFns: Array<() => void> = [];
const ofs = { ...fs };

export const setVirtualFs = ( dir: NestedDirectoryJSON, cwd: string = process.cwd() ) => {
	restoreFs();
	const virtual = Volume.fromNestedJSON( dir, cwd );
	const ufs = new Union();
	ufs
		.use( virtual as any )
		.use( ofs );
	cleanupFns.push( patchFs( ufs ) );
};

export const restoreFs = () => {
	cleanupFns.forEach( f => f() );
	cleanupFns = [];
};

export { NestedDirectoryJSON };
