import { basename, resolve } from 'path';

import { isString } from 'lodash';
import { Class } from 'type-fest';
import { Application, DeclarationReflection, DefaultTheme, JSX, LogLevel, ProjectReflection, Reflection, ReflectionKind, RendererEvent, SourceReference, UrlMapping } from 'typedoc';

import { restoreFs, setVirtualFs } from '#plugintestbed';

import { EInvalidPageLinkHandling, IPluginOptions, IRootPageNode } from '../../options';
import { PagesPlugin } from '../../plugin';
import { MenuReflection, NodeReflection, PageReflection } from '../../reflections';
import { RenderPageLinkProps } from '../../theme';
import { APageTreeBuilder } from './a-page-tree-builder';

class TestHost extends APageTreeBuilder {
	public readonly renderPageLink = jest.fn<JSX.Element | string, [RenderPageLinkProps]>();
	public readonly generateMappings = jest.fn<Array<UrlMapping<PageReflection>>, [event: RendererEvent, reflections: NodeReflection[]]>();
	public readonly addNodeToProjectAsChild = jest.fn<void, [odeReflection: NodeReflection]>();
	public constructor(){
		super( theme, plugin );
	}
}
let application: Application;
let theme: DefaultTheme;
let plugin: PagesPlugin;
let testHost: TestHost;
let project: ProjectReflection;
const opts = ( pages: IRootPageNode[] ) => ( {
	pages,
	enablePageLinks: true,
	enableSearch: true,
	invalidPageLinkHandling: EInvalidPageLinkHandling.FAIL,
	logLevel: LogLevel.Error,
	output: '',
	source: '',
} as IPluginOptions );
beforeEach( () => {
	application = new Application();
	theme = new DefaultTheme( application.renderer );
	plugin = new PagesPlugin( application );
	testHost = new TestHost();
	project = new ProjectReflection( 'TEST' );
	project.sources = [
		new SourceReference( resolve( basename( __filename ) ), 0, 0 ),
	];
} );
afterEach( restoreFs );
const addChildModule = ( name: string ) => {
	const moduleRef = new DeclarationReflection( name, ReflectionKind.Module, project );
	moduleRef.sources = [
		new SourceReference( resolve( `${name}/index.ts` ), 0, 0 ),
	];
	project.children ??= [];
	project.children.push( moduleRef );
	project.registerReflection( moduleRef );
	return moduleRef;
};
const matchReflection = <T extends Reflection>( proto: Class<T>, sample: Partial<T> ) => expect.toSatisfy( v => {
	expect( v ).toBeInstanceOf( proto );
	const s = sample as any;
	if( 'sourceFilePath' in s && isString( s.sourceFilePath ) ){
		s.sourceFilePath = resolve( s.sourceFilePath );
	}
	expect( v ).toMatchObject( sample );
	const children = ( sample as any ).children;
	if( children ){
		expect( v.children ).toHaveLength( children.length );
		expect( v.children ).toSatisfyAll( c => c.parent === v );
	} else {
		expect( v.children ).toEqual( [] );
	}
	return true;
} );
describe( APageTreeBuilder.name, () => {
	it( 'should map simple page', () => {
		setVirtualFs( {
			'foo.md': 'Foo content',
		} );
		const out = testHost.buildPagesTree( project, opts( [ { title: 'Foo', source: 'foo.md'  } ] ) );
		expect( out ).toHaveLength( 1 );
		expect( out ).toIncludeSameMembers( [
			matchReflection( PageReflection, { name: 'Foo', depth: 0, module: project } ),
		] );
	} );
	it( 'should strip empty menu', () => {
		const out = testHost.buildPagesTree( project, opts( [ { title: 'Foo' } ] ) );
		expect( out ).toHaveLength( 0 );
	} );
	it( 'should map menu with children', () => {
		setVirtualFs( {
			'bar.md': 'Bar content',
			'baz.md': 'Baz content',
		} );
		const out = testHost.buildPagesTree( project, opts( [ { title: 'Foo', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] ) );
		expect( out ).toHaveLength( 1 );
		expect( out ).toIncludeSameMembers( [
			matchReflection( MenuReflection, { name: 'Foo', depth: 0, module: project, children: [
				matchReflection( PageReflection, { name: 'Bar', depth: 1, module: project, sourceFilePath: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
				matchReflection( PageReflection, { name: 'Baz', depth: 1, module: project, sourceFilePath: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
			] } ),
		] );
	} );
	it( 'should map virtual menu with no children', () => {
		const out = testHost.buildPagesTree( project, opts( [ { title: 'VIRTUAL', children: [] } ] ) );
		expect( out ).toHaveLength( 0 );
	} );
	it( 'should map virtual menu with children', () => {
		setVirtualFs( {
			'bar.md': 'Bar content',
			'baz.md': 'Baz content',
		} );
		const out = testHost.buildPagesTree( project, opts( [ { title: 'VIRTUAL', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] ) );
		expect( out ).toHaveLength( 2 );
		expect( out ).toIncludeSameMembers( [
			matchReflection( PageReflection, { name: 'Bar', depth: 0, module: project, sourceFilePath: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
			matchReflection( PageReflection, { name: 'Baz', depth: 0, module: project, sourceFilePath: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
		] );
	} );
	it( 'should map page with children', () => {
		setVirtualFs( {
			'foo.md': 'Foo content',
			'foo': {
				'bar.md': 'Bar content',
				'baz.md': 'Baz content',
			},
		} );
		const out = testHost.buildPagesTree( project, opts( [ { title: 'Foo', source: 'foo.md', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] ) );
		expect( out ).toHaveLength( 1 );
		expect( out ).toIncludeSameMembers( [
			matchReflection( PageReflection, { name: 'Foo', depth: 0, module: project, sourceFilePath: 'foo.md', content: 'Foo content', url: 'foo/index.html',  children: [
				matchReflection( PageReflection, { name: 'Bar', depth: 1, module: project, sourceFilePath: 'foo/bar.md', content: 'Bar content', url: 'foo/bar.html' } ),
				matchReflection( PageReflection, { name: 'Baz', depth: 1, module: project, sourceFilePath: 'foo/baz.md', content: 'Baz content', url: 'foo/baz.html' } ),
			] } ),
		] );
	} );
	it( 'should map menu to workspace with children', () => {
		const targetModule = addChildModule( 'SUB' );
		addChildModule( 'SUB2' );
		setVirtualFs( {
			'bar.md': 'Bar content',
			'baz.md': 'Baz content',
		} );
		const out = testHost.buildPagesTree( project, opts( [ { title: 'SUB', moduleRoot: true, children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] ) );
		expect( out ).toHaveLength( 1 );
		expect( out ).toIncludeSameMembers( [
			matchReflection( MenuReflection, { name: 'SUB', depth: 0, module: targetModule,  children: [
				matchReflection( PageReflection, { name: 'Bar', depth: 1, module: targetModule, sourceFilePath: 'bar.md', content: 'Bar content', url: 'SUB/bar.html' } ),
				matchReflection( PageReflection, { name: 'Baz', depth: 1, module: targetModule, sourceFilePath: 'baz.md', content: 'Baz content', url: 'SUB/baz.html' } ),
			] } ),
		] );
	} );
	it( 'should map page to workspace with children with pages at root', () => {
		addChildModule( 'SUB' );
		const targetModule = addChildModule( 'SUB2' );
		setVirtualFs( {
			'appendix.md': 'APPENDIX',
			'bar.md': 'Bar content',
			'baz.md': 'Baz content',
		} );
		const out = testHost.buildPagesTree( project, opts( [ { title: 'SUB2', moduleRoot: true, source: 'appendix.md', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] ) );
		expect( out ).toHaveLength( 1 );
		expect( out ).toIncludeSameMembers( [
			matchReflection( PageReflection, { name: 'SUB2', depth: 0, module: targetModule, sourceFilePath: 'appendix.md', children: [
				matchReflection( PageReflection, { name: 'Bar', depth: 1, module: targetModule, sourceFilePath: 'bar.md', content: 'Bar content', url: 'SUB2/bar.html' } ),
				matchReflection( PageReflection, { name: 'Baz', depth: 1, module: targetModule, sourceFilePath: 'baz.md', content: 'Baz content', url: 'SUB2/baz.html' } ),
			] } ),
		] );
	} );
	it( 'should map page to workspace with children with pages in module', () => {
		addChildModule( 'SUB' );
		const targetModule = addChildModule( 'SUB2' );
		setVirtualFs( {
			SUB2: {
				'appendix.md': 'APPENDIX',
				'bar.md': 'Bar content',
				'baz.md': 'Baz content',
			},
		} );
		const out = testHost.buildPagesTree( project, opts( [ { title: 'SUB2', moduleRoot: true, source: 'appendix.md', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] ) );
		expect( out ).toHaveLength( 1 );
		expect( out ).toIncludeSameMembers( [
			matchReflection( PageReflection, { name: 'SUB2', depth: 0, module: targetModule, sourceFilePath: 'SUB2/appendix.md', children: [
				matchReflection( PageReflection, { name: 'Bar', depth: 1, module: targetModule, sourceFilePath: 'SUB2/bar.md', content: 'Bar content', url: 'SUB2/bar.html' } ),
				matchReflection( PageReflection, { name: 'Baz', depth: 1, module: targetModule, sourceFilePath: 'SUB2/baz.md', content: 'Baz content', url: 'SUB2/baz.html' } ),
			] } ),
		] );
	} );
} );
