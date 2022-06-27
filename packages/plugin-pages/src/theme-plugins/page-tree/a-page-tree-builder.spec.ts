import { basename, resolve } from 'path';

import { isString } from 'lodash';
import { Class } from 'type-fest';
import { Application, DeclarationReflection, DefaultTheme, JSX, ProjectReflection, Reflection, ReflectionKind, RendererEvent, SourceFile, UrlMapping } from 'typedoc';

import { restoreFs, setVirtualFs, setupTypedocApplication } from '#plugintestbed';

import { IPageNode } from '../../options';
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
		this.project = undefined;
	}

	public set project( project: ProjectReflection | undefined ){
		// eslint-disable-next-line @typescript-eslint/dot-notation
		this['_project'] = project ?? new ProjectReflection( 'TEST' );
		// eslint-disable-next-line @typescript-eslint/dot-notation
		project = this['_project'];
		project.sources = [
			{ file: new SourceFile( resolve( basename( __filename ) ) ), fileName: basename( __filename ), character: 0, line: 0 },
		];
	}
	public override get project(): ProjectReflection {
		// eslint-disable-next-line @typescript-eslint/dot-notation
		return this['_project'] as any;
	}

	public mapPagesToReflections( nodes: IPageNode[], parent?: ProjectReflection | DeclarationReflection, io: {input?: string; output?: string} = {} ): NodeReflection[] {
		// eslint-disable-next-line @typescript-eslint/dot-notation
		return this['_mapPagesToReflections']( nodes, parent ?? this.project, io );
	}
}
let application: Application;
let theme: DefaultTheme;
let plugin: PagesPlugin;
let testHost: TestHost;
beforeEach( () => {
	application = setupTypedocApplication();
	theme = new DefaultTheme( application.renderer );
	plugin = new PagesPlugin( application );
	testHost = new TestHost();
} );
afterEach( restoreFs );
const addChildModule = ( name: string ) => {
	const moduleRef = new DeclarationReflection( name, ReflectionKind.Module, testHost.project );
	moduleRef.sources = [
		{ file: new SourceFile( resolve( `${name}/index.ts` ) ), fileName: 'index.ts', character: 0, line: 0 },
	];
	testHost.project.children ??= [];
	testHost.project.children.push( moduleRef );
	testHost.project.registerReflection( moduleRef );
	return moduleRef;
};
const matchReflection = <T extends Reflection>( proto: Class<T>, sample: Partial<T> ) => expect.toSatisfy( v => {
	expect( v ).toBeInstanceOf( proto );
	const s = sample as any;
	if( 'sourceFilePath' in s && isString( s.sourceFilePath ) ){
		s.sourceFilePath = resolve( s.sourceFilePath );
	}
	expect( v ).toMatchObject( sample );
	return true;
} );
describe( APageTreeBuilder.name, () => {
	it( 'should map simple page', () => {
		setVirtualFs( {
			'foo.md': 'Foo content',
		} );
		const out = testHost.mapPagesToReflections( [ { title: 'Foo', source: 'foo.md'  } ] );
		expect( out ).toHaveLength( 1 );
		expect( out ).toEqual( [
			matchReflection( PageReflection, { name: 'Foo', depth: 0, module: testHost.project } ),
		] );
	} );
	it( 'should strip empty menu', () => {
		const out = testHost.mapPagesToReflections( [ { title: 'Foo' } ] );
		expect( out ).toHaveLength( 0 );
	} );
	it( 'should map menu with children', () => {
		setVirtualFs( {
			'bar.md': 'Bar content',
			'baz.md': 'Baz content',
		} );
		const out = testHost.mapPagesToReflections( [ { title: 'Foo', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] );
		expect( out ).toHaveLength( 1 );
		expect( out ).toEqual( [
			matchReflection( MenuReflection, { name: 'Foo', depth: 0, module: testHost.project, children: [
				matchReflection( PageReflection, { name: 'Bar', depth: 1, module: testHost.project, sourceFilePath: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
				matchReflection( PageReflection, { name: 'Baz', depth: 1, module: testHost.project, sourceFilePath: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
			] } ),
		] );
	} );
	it( 'should map virtual menu with no children', () => {
		const out = testHost.mapPagesToReflections( [ { title: 'VIRTUAL', children: [] } ] );
		expect( out ).toHaveLength( 0 );
	} );
	it( 'should map virtual menu with children', () => {
		setVirtualFs( {
			'bar.md': 'Bar content',
			'baz.md': 'Baz content',
		} );
		const out = testHost.mapPagesToReflections( [ { title: 'VIRTUAL', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] );
		expect( out ).toHaveLength( 2 );
		expect( out ).toEqual( [
			matchReflection( PageReflection, { name: 'Bar', depth: 0, module: testHost.project, sourceFilePath: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
			matchReflection( PageReflection, { name: 'Baz', depth: 0, module: testHost.project, sourceFilePath: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
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
		const out = testHost.mapPagesToReflections( [ { title: 'Foo', source: 'foo.md', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] );
		expect( out ).toHaveLength( 1 );
		expect( out ).toEqual( [
			matchReflection( PageReflection, { name: 'Foo', depth: 0, module: testHost.project, sourceFilePath: 'foo.md', content: 'Foo content', url: 'foo/index.html',  children: [
				matchReflection( PageReflection, { name: 'Bar', depth: 1, module: testHost.project, sourceFilePath: 'foo/bar.md', content: 'Bar content', url: 'foo/bar.html' } ),
				matchReflection( PageReflection, { name: 'Baz', depth: 1, module: testHost.project, sourceFilePath: 'foo/baz.md', content: 'Baz content', url: 'foo/baz.html' } ),
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
		const out = testHost.mapPagesToReflections( [ { title: 'SUB', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] );
		expect( out ).toHaveLength( 1 );
		expect( out ).toEqual( [
			matchReflection( MenuReflection, { name: 'SUB', depth: 0, module: targetModule,  children: [
				matchReflection( PageReflection, { name: 'Bar', depth: 1, module: targetModule, sourceFilePath: 'bar.md', content: 'Bar content', url: 'SUB/bar.html' } ),
				matchReflection( PageReflection, { name: 'Baz', depth: 1, module: targetModule, sourceFilePath: 'baz.md', content: 'Baz content', url: 'SUB/baz.html' } ),
			] } ),
		] );
	} );
	it( 'should page to workspace with children', () => {
		addChildModule( 'SUB' );
		const targetModule = addChildModule( 'SUB2' );
		setVirtualFs( {

			'appendix.md': 'APPENDIX',
			'bar.md': 'Bar content',
			'baz.md': 'Baz content',
		} );
		const out = testHost.mapPagesToReflections( [ { title: 'SUB2', source: 'appendix.md', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] );
		expect( out ).toHaveLength( 1 );
		expect( out ).toEqual( [
			matchReflection( PageReflection, { name: 'SUB2', depth: 0, module: targetModule, sourceFilePath: 'appendix.md', children: [
				matchReflection( PageReflection, { name: 'Bar', depth: 1, module: targetModule, sourceFilePath: 'bar.md', content: 'Bar content', url: 'SUB2/bar.html' } ),
				matchReflection( PageReflection, { name: 'Baz', depth: 1, module: targetModule, sourceFilePath: 'baz.md', content: 'Baz content', url: 'SUB2/baz.html' } ),
			] } ),
		] );
	} );
	it( 'should page to workspace with children', () => {
		addChildModule( 'SUB' );
		const targetModule = addChildModule( 'SUB2' );
		setVirtualFs( {
			SUB2: {
				'appendix.md': 'APPENDIX',
				'bar.md': 'Bar content',
				'baz.md': 'Baz content',
			},
		} );
		const out = testHost.mapPagesToReflections( [ { title: 'SUB2', source: 'appendix.md', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] );
		expect( out ).toHaveLength( 1 );
		expect( out ).toEqual( [
			matchReflection( PageReflection, { name: 'SUB2', depth: 0, module: targetModule, sourceFilePath: 'SUB2/appendix.md', children: [
				matchReflection( PageReflection, { name: 'Bar', depth: 1, module: targetModule, sourceFilePath: 'SUB2/bar.md', content: 'Bar content', url: 'SUB2/bar.html' } ),
				matchReflection( PageReflection, { name: 'Baz', depth: 1, module: targetModule, sourceFilePath: 'SUB2/baz.md', content: 'Baz content', url: 'SUB2/baz.html' } ),
			] } ),
		] );
	} );
} );
