import { readFile } from 'fs/promises';
import { resolve } from 'path';

export const checkFile = async ( ...args: [...paths: string[], withContent: ( text: string ) => Promise<void> | void] ) => {
	const fullPath = resolve( ...args.slice( 0, -1 ) as string[] );
	const content = await readFile( fullPath, 'utf-8' );
	const cb = args[args.length - 1] as ( text: string ) => Promise<void> | void;
	await cb( content );
};
