import { dump as stringifyToYaml } from 'js-yaml';
import { last } from 'lodash';
import { vol } from 'memfs';
import { NestedDirectoryJSON } from 'memfs/lib/volume';

import { join, resolve } from '@knodes/typedoc-pluginutils/path';

import { MockPlugin, mockPlugin } from '#plugintestbed';

import { FrontMatterNodeLoader } from './front-matter';
import { PagesPlugin } from '../../plugin';
import { trimExt } from '../utils';

jest.mock( 'fs', () => jest.requireActual( 'memfs' ).fs );

const makeMenu = <T extends Record<string, any>>( obj: T ) => ( {
	file: stringifyToYaml( obj ),
	node: obj,
} );
const makePage = <T extends Record<string, any>>( obj: T, content = '' ) => ( {
	file: `---
${stringifyToYaml( obj )}
---
${content}`,
	node: { ...obj, content },
} );
const mkPath = ( { root }: {root: string}, file: string, ext = 'md' ) => ( {
	virtual: join( root, file ).replace( /(\/index)+$/, '' ),
	fs: resolve( __dirname, root, `${file}.${ext}` ),
} );
const matchNodeByName = ( name: string ) => expect.objectContaining( { name } );

let plugin: MockPlugin<PagesPlugin>;
let loader: FrontMatterNodeLoader;
beforeEach( () => {
	jest.clearAllMocks();
	plugin = mockPlugin<PagesPlugin>( { rootDir: __dirname } );
	loader = new FrontMatterNodeLoader( plugin );
} );
afterEach( () => vol.reset() );
process.chdir( __dirname );

describe( 'collectNodes', () => {
	const ROOT_NODE = { name: 'ROOT', path: { fs: __dirname, virtual: '~' }};
	const RECURSE_MOCK = jest.fn( () => {throw new Error();} );
	const DEFAULT_COLLECT_CONTEXT = { parents: [ ROOT_NODE ], recurse: RECURSE_MOCK };
	it( 'should collect pages & menus for every files', () => {
		vol.fromNestedJSON( {
			'pages': { 'root-page.md': '' },
			'test': { 'index.yaml': '', 'foo.md': '' },
			'root-readme.md': '',
		} );
		const node = {
			loader: 'frontMatter',
			root: '.',
		} as const;
		const nodes = [ ...loader.collectNodes( node, DEFAULT_COLLECT_CONTEXT ) ];
		expect( nodes ).toContainEqual( {
			node: { name: 'Root readme', path: mkPath( node, 'root-readme' ), content: '' },
			parents: [ ROOT_NODE ],
		} );
		expect( nodes ).toContainEqual( {
			node: { name: 'Pages' },
			parents: [ ROOT_NODE ],
		} );
		expect( nodes ).toContainEqual( {
			node: { name: 'Root page', path: mkPath( node, 'pages/root-page' ), content: '' },
			parents: [ matchNodeByName( 'Pages' ), ROOT_NODE ],
		} );
		expect( nodes ).toContainEqual( {
			node: { name: 'Test', path: mkPath( node, 'test/index', 'yaml' ) },
			parents: [ ROOT_NODE ],
		} );
		expect( nodes ).toContainEqual( {
			node: { name: 'Foo', path: mkPath( node, 'test/foo' ), content: '' },
			parents: [ matchNodeByName( 'Test' ), ROOT_NODE ],
		} );
	} );
	it( 'should parse front-matter correctly', () => {
		const file = 'index.md';
		const page = makePage( { name: 'Hello world' }, '# Sample\n\nThis is a demo page' );
		vol.fromNestedJSON( { [file]: page.file } );
		const nodes = [ ...loader.collectNodes( { loader: 'frontMatter', root: '.' }, DEFAULT_COLLECT_CONTEXT ) ];
		expect( nodes ).toEqual( [
			expect.objectContaining( {
				node: { path: { fs: resolve( file ), virtual: 'index', urlFragment: expect.toBeNil() }, ...page.node },
			} ),
		] );
	} );
	it( 'should not emit menu node for front-matter container', () => {
		const FILE = 'foo.md';
		const page = makePage( { name: 'Hello world' }, '# Sample\n\nThis is a demo page' );
		const CONTAINER = 'pages';
		vol.fromNestedJSON( { [CONTAINER]: { [FILE]: page.file }} );
		const nodes = [ ...loader.collectNodes( { loader: 'frontMatter', root: CONTAINER }, DEFAULT_COLLECT_CONTEXT ) ];
		expect( nodes ).toEqual( [ {
			node: {
				path: {
					fs: resolve( CONTAINER, FILE ),
					virtual: join( CONTAINER, trimExt( FILE ) ),
					urlFragment: expect.not.stringContaining( CONTAINER ),
				},
				...page.node,
			},
			parents: [ ROOT_NODE ],
		} ] );
	} );
	it( 'should yield pages in correct order', () => {
		const ENTRY_1 = makePage( { name: 'ENTRY_1' } );
		const ENTRY_2 = makePage( { name: 'ENTRY_2' } );
		const ENTRY_2_1 = makePage( { name: 'ENTRY_2_1' } );
		const ENTRY_2_2 = makePage( { name: 'ENTRY_2_2' } );
		const ENTRY_3_1 = makePage( { name: 'ENTRY_3_1' } );
		const ENTRY_3_2 = makePage( { name: 'ENTRY_3_2' } );
		const ENTRY_4 = makePage( { name: 'ENTRY_4' } );
		const CONTAINER = 'pages';
		vol.fromNestedJSON( { [CONTAINER]: {
			'ENTRY_1.md': ENTRY_1.file,
			'ENTRY_2': {
				'index.md': ENTRY_2.file,
				'ENTRY_2_1.md': ENTRY_2_1.file,
				'ENTRY_2_2.md': ENTRY_2_2.file,
			},
			'ENTRY_3': {
				'ENTRY_3_1.md': ENTRY_3_1.file,
				'ENTRY_3_2.md': ENTRY_3_2.file,
			},
			'ENTRY_4.md': ENTRY_4.file,
		}} );
		const nodes = [ ...loader.collectNodes( { loader: 'frontMatter', root: CONTAINER }, DEFAULT_COLLECT_CONTEXT ) ];
		expect( nodes ).toEqual( [
			{ node: matchNodeByName( ENTRY_1.node.name ), parents: [ ROOT_NODE ] },
			{ node: matchNodeByName( ENTRY_2.node.name ), parents: [ ROOT_NODE ] },
			{ node: matchNodeByName( ENTRY_2_1.node.name ), parents: [ matchNodeByName( ENTRY_2.node.name ), ROOT_NODE ] },
			{ node: matchNodeByName( ENTRY_2_2.node.name ), parents: [ matchNodeByName( ENTRY_2.node.name ), ROOT_NODE ] },
			{ node: matchNodeByName( 'Entry 3' ), parents: [ ROOT_NODE ] },
			{ node: matchNodeByName( ENTRY_3_1.node.name ), parents: [ matchNodeByName( 'Entry 3' ), ROOT_NODE ] },
			{ node: matchNodeByName( ENTRY_3_2.node.name ), parents: [ matchNodeByName( 'Entry 3' ), ROOT_NODE ] },
			{ node: matchNodeByName( ENTRY_4.node.name ), parents: [ ROOT_NODE ] },
		] );
	} );
	it( 'should not emit menu node for front-matter container (deep)', () => {
		const FILE = 'foo.md';
		const page = makePage( { name: 'Hello world' }, '# Sample\n\nThis is a demo page' );
		const CONTAINER = 'pages';
		const CONTAINER2 = 'sub-dir';
		vol.fromNestedJSON( { [CONTAINER]: { [CONTAINER2]:{ [FILE]: page.file }}} );
		const nodes = [ ...loader.collectNodes( { loader: 'frontMatter', root: CONTAINER }, DEFAULT_COLLECT_CONTEXT ) ];
		expect( nodes ).toEqual( [
			{
				node:{ name: 'Sub dir' },
				parents: [ ROOT_NODE ],
			},
			{
				node: {
					path: {
						fs: resolve( CONTAINER, CONTAINER2, FILE ),
						virtual: join( CONTAINER, CONTAINER2, trimExt( FILE ) ),
						urlFragment: expect.not.stringContaining( CONTAINER ),
					},
					...page.node,
				},
				parents: [ { name: 'Sub dir' }, ROOT_NODE ],
			},
		] );
	} );

	describe( 'Nodes tree collection', () => {
		const root = {
			loader: 'frontMatter' as const,
			root: 'pages',
		};
		describe( 'Simple tree registration', () => {
			const rootPage = makePage( { name: 'Root page' }, 'This is the root page' );
			const childPage = makePage( { name: 'Child page' }, 'This is the child page' );
			const rootMenu = makeMenu( { name: 'Root menu' } );
			const childMenu = makeMenu( { name: 'Child menu' } );
			it.each( [
				[ 'page => page', {
					fs: { 'index.md': rootPage.file, 'child.md': childPage.file },
					nodes: [ { path: mkPath( root, 'index' ), ...rootPage.node }, { path: mkPath( root, 'child' ), ...childPage.node } ] as const,
				} ],
				[ 'page => page in sub', {
					fs: { 'index.md': rootPage.file, 'child': { 'index.md': childPage.file }},
					nodes: [ { path: mkPath( root, 'index' ), ...rootPage.node }, { path: mkPath( root, 'child/index' ), ...childPage.node } ] as const,
				} ],
				[ 'menu => page', {
					fs: { 'index.yaml': rootMenu.file, 'child.md': childPage.file },
					nodes: [ { ...rootMenu.node, path: mkPath( root, 'index', 'yaml' ) }, { path: mkPath( root, 'child' ), ...childPage.node } ] as const,
				} ],
				[ 'menu => page in sub', {
					fs: { 'index.yaml': rootMenu.file, 'child': { 'index.md': childPage.file }},
					nodes: [ { ...rootMenu.node, path: mkPath( root, 'index', 'yaml' ) }, { path: mkPath( root, 'child/index' ), ...childPage.node } ] as const,
				} ],
				[ 'page => menu', {
					fs: { 'index.md': rootPage.file, 'child': { 'index.yaml': childMenu.file }},
					nodes: [ { path: mkPath( root, 'index' ), ...rootPage.node }, { ...childMenu.node, path: mkPath( root, 'child/index', 'yaml' ) } ] as const,
				} ],
				[ 'menu => menu', {
					fs: { 'index.yaml': rootMenu.file, 'child': { 'index.yaml': childMenu.file }},
					nodes: [ { ...rootMenu.node, path: mkPath( root, 'index', 'yaml' ) }, { ...childMenu.node, path: mkPath( root, 'child/index', 'yaml' ) } ] as const,
				} ],
			] )( 'should build tree correctly for %s', ( _, { fs, nodes: expectedNodes } ) => {
				vol.fromNestedJSON( { [root.root]: fs } );
				const nodes = [ ...loader.collectNodes( root, DEFAULT_COLLECT_CONTEXT ) ];
				expect( nodes ).toEqual( [
					{ node: expectedNodes[0], parents: [ ROOT_NODE ] },
					{ node: expectedNodes[1], parents: [ expectedNodes[0], ROOT_NODE ] },
				] );
			} );
		} );
		describe( 'Node name inference', () => {
			it.each<{expectedName: string; fs: NestedDirectoryJSON}>( [
				{ expectedName: 'Implicit in index dir', fs: { 'implicit-in-index-dir': { 'index.yaml': '' }}},
				{ expectedName: 'Explicit in index dir', fs: { test: { 'index.yaml': makeMenu( { name: 'Explicit in index dir' } ).file }}},
				{ expectedName: 'Implicit in dir', fs: { test: { 'implicit-in-dir.yaml': '' }}},
				{ expectedName: 'Implicit in index file', fs: { 'implicit-in-index-file': { 'index.md': '' }}},
				{ expectedName: 'Explicit in index file', fs: { test: { 'index.md': makePage( { name: 'Explicit in index file' } ).file }}},
				{ expectedName: 'Implicit in file', fs: { test: { 'implicit-in-file.md': '' }}},
			] )( 'should output node with name "$expectedName"', ( { expectedName, fs } ) => {
				vol.fromNestedJSON( { [root.root]: fs } );
				const nodes = [ ...loader.collectNodes( root, DEFAULT_COLLECT_CONTEXT ) ];
				expect( last( nodes ) ).toMatchObject( { node: { name: expectedName }} );
			} );
		} );
	} );
} );

describe( 'checkConfigNode', () => {
	it.todo( 'TODO' );
} );
