import { resolve } from 'path';

import { once } from 'lodash';

import { IPluginOptions } from './plugin-options';
import { readPluginOptions } from './read-plugin-options';

describe( readPluginOptions.name, () => {
	type TestCase = {input?: IPluginOptions | string; output: IPluginOptions; setup?: ( testCase: TestCase ) => any; tearDown?: ( testCase: TestCase, setupData: any ) => void};
	afterEach( () => {
		jest.resetModules();
	} );
	const targetDefaultJson = once( () => resolve( 'pagesconfig.json' ) );
	const targetDefaultJs = once( () => resolve( 'pagesconfig.js' ) );
	const targetInputJson = once( ( input: string ) => resolve( input as string ) );
	const targetInputJs = once( ( input: string ) => resolve( input as string ) );
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	it.each( ( <Array<[label: string, test: TestCase ]>>[
		[ 'Defaults', {
			input: {},
			output: { source: 'pages', output: 'pages' },
		} ],
		[ 'Default import (JSON)', {
			output: { source: 'pages', output: 'pages', pages: [ { title: new Date().toISOString() } ] },
			setup: ( { output: { pages }} ) => {
				const requireSpy = jest.fn().mockImplementation( () => {
					jest.unmock( targetDefaultJson() );
					return { pages };
				} );
				jest.mock( targetDefaultJson(), () => requireSpy(), { virtual: true } );
				return { requireSpy };
			},
			tearDown: ( _, { requireSpy } ) => {
				expect( requireSpy ).toHaveBeenCalledTimes( 1 );
			},
		} ],
		[ 'Default import (JS)', {
			output: { source: 'pages', output: 'pages', pages: [ { title: new Date().toISOString() } ] },
			setup: ( { output: { pages }} ) => {
				const requireSpy = jest.fn().mockImplementation( () => {
					jest.unmock( targetDefaultJs() );
					return { pages };
				} );
				jest.mock( targetDefaultJs(), () => requireSpy(), { virtual: true } );
				return { requireSpy };
			},
			tearDown: ( _, { requireSpy } ) => {
				expect( requireSpy ).toHaveBeenCalledTimes( 1 );
			},
		} ],
		[ 'Import (JSON)', {
			input: 'test.json',
			output: { source: 'pages', output: 'pages', pages: [ { title: new Date().toISOString() } ] },
			setup: ( { input, output: { pages }} ) => {
				const requireSpy = jest.fn().mockImplementation( () => {
					jest.unmock( targetInputJson( input as any ) );
					return { pages };
				} );
				jest.mock( targetInputJson( input as any ), () => requireSpy(), { virtual: true } );
				return { requireSpy };
			},
			tearDown: ( _, { requireSpy } ) => {
				expect( requireSpy ).toHaveBeenCalledTimes( 1 );
			},
		} ],
		[ 'Import (JS)', {
			input: 'test.js',
			output: { source: 'pages', output: 'pages', pages: [ { title: new Date().toISOString() } ] },
			setup: ( { input, output: { pages }} ) => {
				const requireSpy = jest.fn().mockImplementation( () => {
					jest.unmock( targetInputJs( input as any ) );
					return { pages };
				} );
				jest.mock( targetInputJs( input as any ), () => requireSpy(), { virtual: true } );
				return { requireSpy };
			},
			tearDown: ( _, { requireSpy } ) => {
				expect( requireSpy ).toHaveBeenCalledTimes( 1 );
			},
		} ],
	] ).map( ( [ label, { input, output, setup, tearDown } ] ) => {
		const base = [ label, { input, output, setup, tearDown } ] as const;
		if( typeof input === 'object' && input ){
			return [
				base,
				[ `${label} (JSON)`, { input: JSON.stringify( input ), output, setup, tearDown } ] as const,
			];
		} else {
			return [ base ];
		}
	} ).flat( 1 ) )( 'Options %s', ( _label, params ) => {
		const { input, output, setup, tearDown } = params;
		const setupData = setup?.( params );
		expect( readPluginOptions( input ) ).toEqual( output );
		tearDown?.( params, setupData );
	} );
} );
