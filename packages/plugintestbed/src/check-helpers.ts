import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { JSDOM } from 'jsdom';

export const testDocsFile = ( ...args: [rootDir: string, ...paths: string[], withContent: ( text: string ) => Promise<void> | void] ) => async () => {
	const fullPath = resolve( args[0], 'docs', ...args.slice( 1, -1 ) as string[] );
	const content = await readFile( fullPath, 'utf-8' );
	const cb = args[args.length - 1] as ( text: string ) => Promise<void> | void;
	await cb( content );
};
type DescribeDocsFileCb = ( test: ( label: string, test: ( content: string, dom: JSDOM ) => Promise<void> | void ) => void ) => void;
export const describeDocsFile = ( ...args: [rootDir: string, ...paths: string[], cb: DescribeDocsFileCb] ) => () => {
	let content: string;
	let jsdom: JSDOM;
	const fullPath = resolve( args[0], 'docs', ...args.slice( 1, -1 ) as string[] );
	beforeAll( async () => {
		content = await readFile( fullPath, 'utf-8' );
		jsdom = new JSDOM( content );
	} );
	const cb = args[args.length - 1] as DescribeDocsFileCb;
	cb( ( label, test ) => it( label, () => test( content, jsdom ) as any ) );
};

export const getBreadcrumb = ( dom: JSDOM ): Array<{href: string | null; text: string | null}> => {
	const breadcrumbs = dom.window.document.querySelectorAll( '.tsd-breadcrumb' );
	expect( breadcrumbs ).toHaveLength( 1 );
	return Array.from( breadcrumbs[0].querySelectorAll<HTMLSpanElement | HTMLAnchorElement>( 'li > *' ) )
		.map( a => ( { href: 'href' in a ? a.href : null, text: a.textContent } ) );
};
