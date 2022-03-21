import { readFile } from 'fs/promises';
import { resolve } from 'path';

export const checkDocsFile = ( ...args: [rootDir: string, ...paths: string[], withContent: ( text: string ) => Promise<void> | void] ) => async () => {
	const fullPath = resolve( args[0], 'docs', ...args.slice( 1, -1 ) as string[] );
	const content = await readFile( fullPath, 'utf-8' );
	const cb = args[args.length - 1] as ( text: string ) => Promise<void> | void;
	await cb( content );
};
