import { vol } from 'memfs';

import { MockPlugin, mockPlugin } from '#plugintestbed';

import { TemplateNodeLoader } from './template';
import { PagesPlugin } from '../../plugin';

jest.mock( 'fs', () => jest.requireActual( 'memfs' ).fs );

let plugin: MockPlugin<PagesPlugin>;
let loader: TemplateNodeLoader;
beforeEach( () => {
	jest.clearAllMocks();
	plugin = mockPlugin<PagesPlugin>( { rootDir: __dirname } );
	loader = new TemplateNodeLoader( plugin );
} );
afterEach( () => vol.reset() );
process.chdir( __dirname );
describe( 'collectNodes', () => {
	const ROOT_NODE = { name: 'ROOT', path: { fs: __dirname, virtual: '~' }};
	const RECURSE_MOCK = jest.fn( function*(){yield* [];} );
	const DEFAULT_COLLECT_CONTEXT = { parents: [ ROOT_NODE ], recurse: RECURSE_MOCK };
	it( 'should recurse on matched paths', () => {
		vol.fromNestedJSON( {
			test: { a: {}, b: {}},
			nope: { nope: {}},
		} );
		const nodes = [ ...loader.collectNodes( { match: 'test/*', template: [ { id: 1 }, { id: 2 } ] as any[], loader: 'template' }, DEFAULT_COLLECT_CONTEXT ) ];
		expect( nodes ).toEqual( [] );
		expect( RECURSE_MOCK ).toHaveBeenCalledTimes( 4 );
		expect( RECURSE_MOCK.mock.calls ).toIncludeSameMembers( [
			[ { id: 1 }, DEFAULT_COLLECT_CONTEXT.parents, [ expect.objectContaining( { match: 'test/a' } ) ]],
			[ { id: 2 }, DEFAULT_COLLECT_CONTEXT.parents, [ expect.objectContaining( { match: 'test/a' } ) ]],
			[ { id: 1 }, DEFAULT_COLLECT_CONTEXT.parents, [ expect.objectContaining( { match: 'test/b' } ) ]],
			[ { id: 2 }, DEFAULT_COLLECT_CONTEXT.parents, [ expect.objectContaining( { match: 'test/b' } ) ]],
		] );
	} );
	describe( 'Expansion', () => {
		it( 'should properly expand template object', () => {
			vol.fromNestedJSON( { test: { a: {}}} );
			const nodes = [ ...loader.collectNodes(
				{
					match: 'test/*',
					template: {
						name: '<%= match.match %>',
						foo: { bar: '<%= match.match %>' },
						hello: [ 'world <%= match.match %>', 'coucou <%= match.match %>' ],
					},
					loader: 'template',
				},
				DEFAULT_COLLECT_CONTEXT ) ];
			expect( nodes ).toEqual( [] );
			expect( RECURSE_MOCK ).toHaveBeenCalledTimes( 1 );
			expect( RECURSE_MOCK ).toHaveBeenCalledWith( {
				name: 'test/a',
				foo: { bar: 'test/a' },
				hello: [ 'world test/a', 'coucou test/a' ],
			}, DEFAULT_COLLECT_CONTEXT.parents, [ expect.objectContaining( { match: 'test/a' } ) ] );
		} );
		it( 'should properly expand template array', () => {
			vol.fromNestedJSON( { test: { a: {}}} );
			const nodes = [ ...loader.collectNodes(
				{
					match: 'test/*',
					template: [
						{ name: '<%= match.match %> 1', foo: { bar: '<%= match.match %>' }},
						{ name: '<%= match.match %> 2', hello: [ 'world <%= match.match %>', 'coucou <%= match.match %>' ] },
					],
					loader: 'template',
				},
				DEFAULT_COLLECT_CONTEXT ) ];
			expect( nodes ).toEqual( [] );
			expect( RECURSE_MOCK ).toHaveBeenCalledTimes( 2 );
			expect( RECURSE_MOCK ).toHaveBeenCalledWith( {
				name: 'test/a 1',
				foo: { bar: 'test/a' },
			}, DEFAULT_COLLECT_CONTEXT.parents, [ expect.objectContaining( { match: 'test/a' } ) ] );
			expect( RECURSE_MOCK ).toHaveBeenCalledWith( {
				name: 'test/a 2',
				hello: [ 'world test/a', 'coucou test/a' ],
			}, DEFAULT_COLLECT_CONTEXT.parents, [ expect.objectContaining( { match: 'test/a' } ) ] );
		} );
		it( 'should properly expand template function', () => {
			vol.fromNestedJSON( { test: { a: {}}} );
			const template = jest.fn().mockReturnValue( [] );
			const nodes = [ ...loader.collectNodes(
				{ match: 'test/*', template, loader: 'template' },
				DEFAULT_COLLECT_CONTEXT ) ];
			expect( nodes ).toEqual( [] );
			expect( template ).toHaveBeenCalledTimes( 1 );
			expect( template ).toHaveBeenCalledWith( expect.objectContaining( { match: 'test/a' } ) );
			expect( RECURSE_MOCK ).toHaveBeenCalledTimes( 0 );
		} );
	} );
} );
