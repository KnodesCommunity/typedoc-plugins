import { readFile } from 'fs/promises';
// eslint-disable-next-line no-restricted-imports -- OS-specific path manipulation
import { resolve } from 'path';

import { JSDOM } from 'jsdom';

export const testDocsFile = ( ...args: [rootDir: string, ...paths: string[], withContent: ( text: string ) => Promise<void> | void] ) => async () => {
	const fullPath = resolve( args[0], 'docs', ...args.slice( 1, -1 ) as string[] );
	const content = await readFile( fullPath, 'utf-8' );
	const cb = args[args.length - 1] as ( text: string ) => Promise<void> | void;
	await cb( content );
};

type WithContentFn = ( content: string, dom: JSDOM, document: Document ) => void | undefined | Promise<unknown>
type DescribeDocsFileCb = ( withContentFn: ( fn: WithContentFn ) => jest.ProvidesCallback ) => void;
export const describeDocsFile = ( ...args: [rootDir: string, ...paths: string[], cb: DescribeDocsFileCb] ) => () => {
	let content: string;
	let jsdom: JSDOM;
	const fullPath = resolve( args[0], 'docs', ...args.slice( 1, -1 ) as string[] );
	beforeAll( async () => {
		content = await readFile( fullPath, 'utf-8' );
		jsdom = new JSDOM( content );
	} );
	const cb = args[args.length - 1] as DescribeDocsFileCb;

	const withContent = ( fn: ( ...innerArgs: any[] ) => any ): jest.ProvidesCallback =>
		fn.length === 4 ?
			( doneCb: jest.DoneCallback ) => fn( content, jsdom, jsdom.window.document, doneCb ) :
			() => fn( content, jsdom, jsdom.window.document );
	cb( withContent );
};

export const getBreadcrumb = ( dom: JSDOM ): Array<{href: string | null; text: string | null}> => {
	const breadcrumbs = dom.window.document.querySelectorAll( '.tsd-breadcrumb' );
	expect( breadcrumbs ).toHaveLength( 1 );
	return Array.from( breadcrumbs[0].querySelectorAll<HTMLSpanElement | HTMLAnchorElement>( 'li > *' ) )
		.map( a => ( { href: 'href' in a ? a.href : null, text: a.textContent } ) );
};
