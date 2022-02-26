import mockFs from 'mock-fs';
import { Class } from 'type-fest';
import { Application, ContainerReflection, DeclarationReflection, DefaultTheme, JSX, ProjectReflection, Reflection, ReflectionKind, UrlMapping } from 'typedoc';

import { PageNode } from '../options';
import { PagesPlugin } from '../plugin';
import { MenuReflection, NodeReflection, PageReflection } from '../reflections';
import { RenderPageLinkProps } from '../theme';
import { APageTreeBuilder, IDeepParams } from './a-page-tree-builder';

class TestHost extends APageTreeBuilder {
	public readonly renderPageLink = jest.fn<JSX.Element | string, [RenderPageLinkProps]>();
	public readonly getNodeTitle = jest.fn<string, [deepParams: IDeepParams, node: PageNode]>().mockImplementation( ( { depth, module }, { title } ) => `${module}|${depth}|${title}` );
	public readonly generateMappings = jest.fn<Array<UrlMapping<PageReflection>>, [reflections: NodeReflection[]]>();
	public readonly addNodeToProjectAsChild = jest.fn<void, [deepParams: IDeepParams, nodeReflection: NodeReflection]>();
	public constructor(){
		super( theme, plugin );
		this.project = undefined;
	}

	public set project( project: ProjectReflection | undefined ){
		// eslint-disable-next-line @typescript-eslint/dot-notation
		this['_project'] = project ?? new ProjectReflection( 'TEST' );
	}
	public override get project(): ProjectReflection {
		// eslint-disable-next-line @typescript-eslint/dot-notation
		return this['_project'] as any;
	}

	public mapPagesToReflections( nodes: PageNode[], inputDir?: string, outputDir?: string, parent?: ContainerReflection ): NodeReflection[] {
		// eslint-disable-next-line @typescript-eslint/dot-notation
		return this['_mapPagesToReflections']( { depth: 0 }, nodes, inputDir, outputDir, parent );
	}
}
let application: Application;
let theme: DefaultTheme;
let plugin: PagesPlugin;
let testHost: TestHost;
beforeEach( () => {
	application = new Application();
	theme = new DefaultTheme( application.renderer );
	plugin = new PagesPlugin( application );
	testHost = new TestHost();
} );
afterEach( mockFs.restore );
const matchReflection = <T extends Reflection>( proto: Class<T>, sample: Partial<T> ) => expect.toSatisfy( v => {
	expect( v ).toBeInstanceOf( proto );
	expect( v ).toMatchObject( sample );
	return true;
} );
describe( APageTreeBuilder.name, () => {
	it( 'should map simple menu', () => {
		const out = testHost.mapPagesToReflections( [ { title: 'Foo' } ] );
		expect( out ).toHaveLength( 1 );
		expect( out ).toEqual( [
			matchReflection( MenuReflection, { name: 'Project TEST|0|Foo' } ),
		] );
	} );
	it( 'should map menu with children', () => {
		mockFs( {
			'bar.md': 'Bar content',
			'baz.md': 'Baz content',
		} );
		const out = testHost.mapPagesToReflections( [ { title: 'Foo', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] );
		expect( out ).toHaveLength( 1 );
		expect( out ).toEqual( [
			matchReflection( MenuReflection, { name: 'Project TEST|0|Foo', children: [
				matchReflection( PageReflection, { name: 'Project TEST|1|Bar', filename: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
				matchReflection( PageReflection, { name: 'Project TEST|1|Baz', filename: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
			] } ),
		] );
	} );
	it( 'should map virtual menu with no children', () => {
		const out = testHost.mapPagesToReflections( [ { title: 'VIRTUAL', children: [] } ] );
		expect( out ).toHaveLength( 0 );
	} );
	it( 'should map virtual menu with children', () => {
		mockFs( {
			'bar.md': 'Bar content',
			'baz.md': 'Baz content',
		} );
		const out = testHost.mapPagesToReflections( [ { title: 'VIRTUAL', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] );
		expect( out ).toHaveLength( 2 );
		expect( out ).toEqual( [
			matchReflection( PageReflection, { name: 'Project TEST|0|Bar', filename: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
			matchReflection( PageReflection, { name: 'Project TEST|0|Baz', filename: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
		] );
	} );
	it( 'should map menu to workspace with children', () => {
		testHost.project.children = [
			new DeclarationReflection( 'SUB', ReflectionKind.Module, testHost.project ),
			new DeclarationReflection( 'SUB2', ReflectionKind.Module, testHost.project ),
		];
		mockFs( {
			'bar.md': 'Bar content',
			'baz.md': 'Baz content',
		} );
		const out = testHost.mapPagesToReflections( [ { title: 'Foo', workspace: 'SUB', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] );
		expect( out ).toHaveLength( 1 );
		expect( out ).toEqual( [
			matchReflection( MenuReflection, { name: 'Module SUB|0|Foo', children: [
				matchReflection( PageReflection, { name: 'Module SUB|1|Bar', filename: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
				matchReflection( PageReflection, { name: 'Module SUB|1|Baz', filename: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
			] } ),
		] );
	} );
	it( 'should throw if workspace is not found', () => {
		testHost.project.children = [
			new DeclarationReflection( 'SUB2', ReflectionKind.Module, testHost.project ),
		];
		expect( () => testHost.mapPagesToReflections( [ { title: 'Foo', workspace: 'SUB', children: [] } ] ) )
			.toThrowWithMessage( Error, /Could not get a module for workspace named "SUB" \(in "Foo"\)/ );
	} );
	it( 'should throw if child if of invalid kind', () => {
		testHost.project.children = [
			new DeclarationReflection( 'SUB', ReflectionKind.Namespace, testHost.project ),
		];
		expect( () => testHost.mapPagesToReflections( [ { title: 'Foo', workspace: 'SUB', children: [] } ] ) )
			.toThrowWithMessage( Error, 'Found reflection for workspace name "SUB" (in "Foo") is not a module reflection' );
	} );
	it( 'should throw if has both a workspace & a parent', () => {
		testHost.project.children = [
			new DeclarationReflection( 'SUB', ReflectionKind.Namespace, testHost.project ),
		];
		expect( () => testHost.mapPagesToReflections( [ { title: 'Foo', workspace: 'SUB', children: [] } ], undefined, undefined, new DeclarationReflection( 'Nope', ReflectionKind.Interface ) ) )
			.toThrowWithMessage( Error, /^Node "Foo" can't have both a parent & a workspace/ );
	} );
} );
