import { DeclarationReflection, LogLevel, ProjectReflection, ReflectionKind, SourceReference } from 'typedoc';

import { resolve } from '@knodes/typedoc-pluginutils/path';

import { MockPlugin, createMockProjectWithPackage, mockPlugin, restoreFs } from '#plugintestbed';

import { PageTreeBuilder } from './page-tree-builder';
import { EInvalidPageLinkHandling, IPluginOptions } from '../../options';
import { PagesPlugin } from '../../plugin';
import { RootNodeLoader } from '../loaders';

let plugin: MockPlugin<PagesPlugin>;
let pageTreeBuilder: PageTreeBuilder;
let project: ProjectReflection;

const opts = ( pages: IPluginOptions['pages'] ) => ( {
	pages,
	enablePageLinks: true,
	enableSearch: true,
	invalidPageLinkHandling: EInvalidPageLinkHandling.FAIL,
	logLevel: LogLevel.Error,
	output: '',
} as IPluginOptions );
const rootNodeLoader = { collectRootNodes: jest.fn(), unregisteredNodes: [] as any[] } as jest.MockedObject<RootNodeLoader>;
beforeEach( () => {
	jest.clearAllMocks();
	rootNodeLoader.unregisteredNodes = [];

	plugin = mockPlugin<PagesPlugin>();
	Object.assign( plugin.application.options.getRawValues(), {
		entryPoints: [ resolve( process.cwd() ) ],
	} );
	pageTreeBuilder = new PageTreeBuilder( plugin, rootNodeLoader );
	project = createMockProjectWithPackage();
} );
process.chdir( __dirname );
afterEach( restoreFs );
const addChildModule = ( name: string, path = name ) => {
	const moduleRef = new DeclarationReflection( name, ReflectionKind.Module, project );
	moduleRef.sources = [
		new SourceReference( resolve( `${path}/index.ts` ), 0, 0 ),
	];
	project.children ??= [];
	project.children.push( moduleRef );
	project.registerReflection( moduleRef );
	Object.assign( plugin.application.options.getRawValues(), {
		entryPoints: [ ...plugin.application.options.getRawValues().entryPoints!, resolve( path ) ],
	} );
	return moduleRef;
};

describe( 'URL generation', () => {
	it( 'should generate correct URL for root page in root', () => {
		rootNodeLoader.collectRootNodes.mockImplementation( function*(){
			yield* [ { node: { name: 'foo', content: 'Test', path: { fs: 'test.md', virtual: 'test' }}, parents: [ { name: project.name } ] } ];
		} );
		const options = { ...opts( [ { name: 'foo' } ] ), output: 'OUTPUT' };
		plugin.setOptions( options );
		const out = pageTreeBuilder.buildPagesTree( project );
		expect( out.childrenNodes![0].childrenNodes![0] ).toMatchObject( { url: `${options.output}/foo.html` } );
	} );
	it( 'should generate correct URL for root page in module', () => {
		const module = addChildModule( 'Module A' );
		rootNodeLoader.collectRootNodes.mockImplementation( function*(){
			yield* [ { node: { name: 'bar', content: 'Test', path: { fs: 'test.md', virtual: 'test' }}, parents: [ { name: module.name } ] } ];
		} );
		const options = { ...opts( [ { name: 'bar' } ] ), output: 'OUTPUT' };
		plugin.setOptions( options );
		const out = pageTreeBuilder.buildPagesTree( project );
		expect( out.childrenNodes![0].childrenNodes![0] ).toMatchObject( { url: `${options.output}/Module_A/bar.html` } );
	} );
} );
