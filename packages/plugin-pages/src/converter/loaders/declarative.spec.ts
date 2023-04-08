import { vol } from 'memfs';

import { resolve } from '@knodes/typedoc-pluginutils/path';

import { MockPlugin, mockPlugin } from '#plugintestbed';

import { DeclarativeNodeLoader } from './declarative';
import { PagesPlugin } from '../../plugin';

jest.mock( 'fs', () => jest.requireActual( 'memfs' ).fs );

let plugin: MockPlugin<PagesPlugin>;
let loader: DeclarativeNodeLoader;
beforeEach( () => {
	jest.clearAllMocks();
	plugin = mockPlugin<PagesPlugin>( { rootDir: __dirname } );
	loader = new DeclarativeNodeLoader( plugin );
} );
afterEach( () => vol.reset() );
process.chdir( __dirname );
describe( 'collectNodes', () => {
	const ROOT_NODE = { name: 'ROOT', path: { fs: resolve( __dirname ), virtual: '~' }};
	const RECURSE_MOCK = jest.fn( function*(){yield* [];} );
	const DEFAULT_COLLECT_CONTEXT = { parents: [ ROOT_NODE ], recurse: RECURSE_MOCK };
	describe( 'No `moduleRoot`', () => {
		it( 'should recurse on children', () => {
			plugin.pluginOptions.getValue().output = 'OUT';
			const children = [ { name: 'bar' }, { name: 'qux' } ];
			const nodes = [ ...loader.collectNodes( { name: 'foo', children }, DEFAULT_COLLECT_CONTEXT ) ];
			expect( nodes ).toEqual( [ { node: { name: 'foo' }, parents: [ ROOT_NODE ] } ] );
			expect( RECURSE_MOCK ).toHaveBeenCalledTimes( children.length );
			expect( RECURSE_MOCK ).toHaveBeenCalledWith( children[0], [ { name: 'foo' }, ...DEFAULT_COLLECT_CONTEXT.parents ], expect.objectContaining( { input: resolve( __dirname ) } ) );
			expect( RECURSE_MOCK ).toHaveBeenCalledWith( children[1], [ { name: 'foo' }, ...DEFAULT_COLLECT_CONTEXT.parents ], expect.objectContaining( { input: resolve( __dirname ) } ) );
		} );
	} );
	describe( 'With `moduleRoot`', () => {
		describe.each( [
			[ 'root', ROOT_NODE, '' ],
			[ 'module', { ...ROOT_NODE, path: { ...ROOT_NODE.path, virtual: 'root', urlFragment: 'module' }}, 'module/' ],
		] )( 'On %s', ( _label, root, output ) => {
			it( 'should recurse on children', () => {
				plugin.pluginOptions.getValue().output = 'OUT';
				const children = [ { name: 'bar' }, { name: 'qux' } ];
				const nodes = [ ...loader.collectNodes( { name: root.name, moduleRoot: true, children }, { ...DEFAULT_COLLECT_CONTEXT, parents: [ root ] } ) ];
				expect( nodes ).toBeArray();
				expect( RECURSE_MOCK ).toHaveBeenCalledTimes( children.length );
				expect( RECURSE_MOCK ).toHaveBeenCalledWith( children[0], [ root ], expect.objectContaining( { input: resolve( root.path.fs ), output: `${output}OUT` } ) );
				expect( RECURSE_MOCK ).toHaveBeenCalledWith( children[1], [ root ], expect.objectContaining( { input: resolve( root.path.fs ), output: `${output}OUT` } ) );
			} );
			it( 'should yield correctly module readme appendix', () => {
				plugin.pluginOptions.getValue().output = 'OUT';
				vol.fromNestedJSON( { 'test.md': 'hello' } );
				const nodes = [ ...loader.collectNodes( { name: root.name, source: 'test.md', moduleRoot: true }, { ...DEFAULT_COLLECT_CONTEXT, parents: [ root ] } ) ];
				expect( nodes ).toEqual( [ {
					node: {
						name: ROOT_NODE.name,
						content: 'hello',
						path: {
							fs: resolve( 'test.md' ),
							virtual: root.path.virtual,
						},
					},
					parents: [],
				} ] );
			} );
			it( 'should recurse on children correctly with module readme appendix', () => {
				plugin.pluginOptions.getValue().output = 'OUT';
				vol.fromNestedJSON( { 'test.md': 'hello' } );
				const children = [ { name: 'bar' }, { name: 'qux' } ];
				const nodes = [ ...loader.collectNodes( { name: root.name, source: 'test.md', moduleRoot: true, children }, { ...DEFAULT_COLLECT_CONTEXT, parents: [ root ] } ) ];
				expect( nodes ).toBeArray();
				expect( RECURSE_MOCK ).toHaveBeenCalledTimes( children.length );
				expect( RECURSE_MOCK ).toHaveBeenCalledWith( children[0], [ root ], expect.objectContaining( { input: resolve( root.path.fs ), output: `${output}OUT` } ) );
				expect( RECURSE_MOCK ).toHaveBeenCalledWith( children[1], [ root ], expect.objectContaining( { input: resolve( root.path.fs ), output: `${output}OUT` } ) );
			} );
		} );
	} );
} );
