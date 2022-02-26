import { resolve } from 'path';

import { IPluginOptions } from './plugin-options';
import { readPluginOptions } from './read-plugin-options';

describe( readPluginOptions.name, () => {
	type TestCase = {input?: IPluginOptions | string; output: IPluginOptions; setup?: ( testCase: TestCase ) => void};
	afterEach( () => {
		jest.resetModules();
	} );
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	it.each( ( <Array<[label: string, test: TestCase ]>>[
		[ 'Defaults', {
			input: {},
			output: { source: 'pages', output: 'pages' },
		} ],
		[ 'Default import (JSON)', {
			output: { source: 'pages', output: 'pages', pages: [ { title: new Date().toISOString() } ] },
			setup: ( { output: { pages }} ) => {
				jest.mock( resolve( 'pagesconfig.json' ), () => ( { pages } ), { virtual: true } );
			},
		} ],
		[ 'Default import (JS)', {
			output: { source: 'pages', output: 'pages', pages: [ { title: new Date().toISOString() } ] },
			setup: ( { output: { pages }} ) => {
				jest.mock( resolve( 'pagesconfig.js' ), () => ( { pages } ), { virtual: true } );
			},
		} ],
		[ 'Import (JSON)', {
			input: 'test.json',
			output: { source: 'pages', output: 'pages', pages: [ { title: new Date().toISOString() } ] },
			setup: ( { input, output: { pages }} ) => {
				jest.mock( resolve( input as string ), () => ( { pages } ), { virtual: true } );
			},
		} ],
		[ 'Import (JS)', {
			input: 'test.js',
			output: { source: 'pages', output: 'pages', pages: [ { title: new Date().toISOString() } ] },
			setup: ( { input, output: { pages }} ) => {
				jest.mock( resolve( input as string ), () => ( { pages } ), { virtual: true } );
			},
		} ],
	] ).map( ( [ label, { input, output, setup } ] ) => {
		const base = [ label, { input, output, setup } ] as const;
		if( typeof input === 'object' && input ){
			return [
				base,
				[ `${label} (JSON)`, { input: JSON.stringify( input ), output, setup } ] as const,
			];
		} else {
			return [ base ];
		}
	} ).flat( 1 ) )( 'Options %s', ( _label, params ) => {
		const { input, output, setup } = params;
		setup?.( params );
		expect( readPluginOptions( input ) ).toEqual( output );
	} );
} );
