import { resolve } from 'path';

import { isString } from 'lodash';
import mockFs from 'mock-fs';
import { Class } from 'type-fest';
import { Application, DeclarationReflection, DefaultTheme, JSX, ProjectReflection, Reflection, ReflectionKind, UrlMapping } from 'typedoc';

import { PageNode } from '../../options';
import { PagesPlugin } from '../../plugin';
import { MenuReflection, NodeReflection, PageReflection } from '../../reflections';
import { RenderPageLinkProps } from '../../theme';
import { APageTreeBuilder } from './a-page-tree-builder';

class TestHost extends APageTreeBuilder {
	public readonly renderPageLink = jest.fn<JSX.Element | string, [RenderPageLinkProps]>();
	public readonly generateMappings = jest.fn<Array<UrlMapping<PageReflection>>, [reflections: NodeReflection[]]>();
	public readonly addNodeToProjectAsChild = jest.fn<void, [odeReflection: NodeReflection]>();
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

	public mapPagesToReflections( nodes: PageNode[], parent?: ProjectReflection | DeclarationReflection, io: {input?: string; output?: string} = {} ): NodeReflection[] {
		// eslint-disable-next-line @typescript-eslint/dot-notation
		return this['_mapPagesToReflections']( nodes, parent ?? this.project, io );
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
	const s = sample as any;
	if( 'sourceFilePath' in s && isString( s.sourceFilePath ) ){
		s.sourceFilePath = resolve( s.sourceFilePath );
	}
	expect( v ).toMatchObject( sample );
	return true;
} );
describe( APageTreeBuilder.name, () => {
	it( 'should map simple page', () => {
		mockFs( {
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
			matchReflection( PageReflection, { name: 'Bar', depth: 0, module: testHost.project, sourceFilePath: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
			matchReflection( PageReflection, { name: 'Baz', depth: 0, module: testHost.project, sourceFilePath: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
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
			matchReflection( MenuReflection, { name: 'Foo', depth: 0, module: testHost.project.children[0],  children: [
				matchReflection( PageReflection, { name: 'Bar', depth: 1, module: testHost.project.children[0], sourceFilePath: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
				matchReflection( PageReflection, { name: 'Baz', depth: 1, module: testHost.project.children[0], sourceFilePath: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
			] } ),
		] );
	} );
	it( 'should map virtual menu to workspace with children', () => {
		testHost.project.children = [
			new DeclarationReflection( 'SUB', ReflectionKind.Module, testHost.project ),
			new DeclarationReflection( 'SUB2', ReflectionKind.Module, testHost.project ),
		];
		mockFs( {
			'bar.md': 'Bar content',
			'baz.md': 'Baz content',
		} );
		const out = testHost.mapPagesToReflections( [ { title: 'VIRTUAL', workspace: 'SUB2', children: [
			{ title: 'Bar', source: 'bar.md' },
			{ title: 'Baz', source: 'baz.md' },
		] } ] );
		expect( out ).toHaveLength( 2 );
		expect( out ).toEqual( [
			matchReflection( PageReflection, { name: 'Bar', depth: 0, module: testHost.project.children[1], sourceFilePath: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
			matchReflection( PageReflection, { name: 'Baz', depth: 0, module: testHost.project.children[1], sourceFilePath: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
		] );
	} );
	it( 'should throw if workspace is not found', () => {
		testHost.project.children = [
			new DeclarationReflection( 'SUB2', ReflectionKind.Module, testHost.project ),
		];
		mockFs( { 'test.md': 'The content' } );
		expect( () => testHost.mapPagesToReflections( [ { title: 'Foo', workspace: 'SUB', source: 'test.md' } ] ) )
			.toThrowWithMessage( Error, /Invalid node workspace override "Foo":\s*Could not get a module for workspace named "SUB"\./ );
	} );
	it( 'should throw if child is of invalid kind', () => {
		testHost.project.children = [
			new DeclarationReflection( 'SUB', ReflectionKind.Namespace, testHost.project ),
		];
		mockFs( { 'test.md': 'The content' } );
		expect( () => testHost.mapPagesToReflections( [ { title: 'Foo', workspace: 'SUB', source: 'test.md' } ] ) )
			.toThrowWithMessage( Error, /Invalid node workspace override "Foo":\s*Found reflection for workspace name "SUB" is not a module reflection$/ );
	} );
} );
