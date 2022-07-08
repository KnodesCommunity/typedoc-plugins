import { Application, DeclarationReflection, DefaultTheme, ProjectReflection, Reflection, ReflectionKind, RendererEvent, UrlMapping } from 'typedoc';

import { restoreFs, setVirtualFs } from '#plugintestbed';

import { PagesPlugin } from '../../plugin';
import { MenuReflection, NodeReflection, PageReflection, PagesPluginReflectionKind } from '../../reflections';
import { ANodeReflection } from '../../reflections/a-node-reflection';
import { DefaultTreeBuilder } from './default-tree-builder';
import { appendChildren } from './utils';

class TestHost extends DefaultTreeBuilder {
	// eslint-disable-next-line @typescript-eslint/dot-notation
	public renderPage = this['_renderPage'];

	public constructor(){
		super( theme, plugin );
	}

	public override generateMappings( event: RendererEvent, reflections: readonly NodeReflection[] ): Array<UrlMapping<PageReflection>> {
		return super.generateMappings( event, reflections );
	}

}
let application: Application;
let theme: DefaultTheme;
let plugin: PagesPlugin;
let testHost: TestHost;
let project: ProjectReflection;
beforeEach( () => {
	application = new Application();
	theme = new DefaultTheme( application.renderer );
	plugin = new PagesPlugin( application );
	testHost = new TestHost();
	project = new ProjectReflection( 'TEST' );
} );
afterEach( restoreFs );
type Children = undefined | readonly [void] | ReadonlyArray<Dec<any, any>>;
type Dec<T extends DeclarationReflection = DeclarationReflection, Child extends Children = undefined> = Omit<T, 'children'> & {children: Child}
const pageReflection = <T extends Children>(
	name: string,
	parent: Dec | ProjectReflection | DeclarationReflection,
	children?: ( r: Dec<PageReflection> ) => T,
): Dec<PageReflection, T> => {
	const r = new PageReflection( name, PagesPluginReflectionKind.PAGE as any, parent instanceof ANodeReflection ? parent.module : parent, parent, `${name}.md`, `${name}.html` ) as any;
	parent.children = [ ...( parent.children ?? [] ), r ];
	appendChildren( parent, r );
	r.children = children?.( r );
	return r as any;
};
const menuReflection = <T extends Children>(
	name: string,
	parent: Dec | ProjectReflection | DeclarationReflection,
	children?: ( r: Dec<MenuReflection> ) => T,
): Dec<MenuReflection, T> => {
	const r = new MenuReflection( name, PagesPluginReflectionKind.MENU as any, parent instanceof ANodeReflection ? parent.module : parent, parent ) as any;
	appendChildren( parent, r );
	r.children = children?.( r );
	return r as any;
};
const matchMapping = ( page: PageReflection | Dec<PageReflection, any> ) => expect.objectContaining( { url: page.url, model: page, template: testHost.renderPage } as Partial<UrlMapping> );
const filterReflections = ( reflections?: Reflection[] ) => reflections?.map( r => ( { name: r.name, ctor: r.constructor.name, id: r.id } ) ) ?? [];
describe( DefaultTreeBuilder.name, () => {
	describe( 'Mappings generation', () => {
		it( 'should return empty list', () => {
			const evt = new RendererEvent( 'test', 'test', new ProjectReflection( 'Test' ) );
			expect( testHost.generateMappings( evt, [] ) ).toEqual( [] );
		} );
		it( 'should map pages correctly to project', () => {
			setVirtualFs( {
				'foo.md': 'Foo content',
				'bar.md': 'Bar content',
				'quux.md': 'Quux content',
			} );
			const nodes = [
				pageReflection( 'foo', project, a => [
					pageReflection( 'bar', a ),
					menuReflection( 'qux', a ),
				] ),
				menuReflection( 'baaz', project, a => [
					pageReflection( 'quux', a ),
				] ),
			] as const;
			const pages = [
				nodes[0],
				nodes[0].children[0],
				nodes[1].children[0],
			];
			const projectChildren = [
				nodes[0],
				nodes[1],
			];
			const evt = new RendererEvent( 'test', 'test', project );
			const mappings = testHost.generateMappings( evt, nodes );
			expect( mappings ).toHaveLength( pages.length );
			expect( mappings ).toIncludeSameMembers( pages.map( p => matchMapping( p ) ) );
			// expect( project.children ).toHaveLength( projectChildren.length );
			expect( filterReflections( project.children ) ).toIncludeSameMembers( filterReflections( projectChildren ) );
		} );
		it( 'should map pages correctly to module', () => {
			setVirtualFs( {
				'Test module.md': 'Test module content',
				'bar.md': 'Bar content',
				'bar2.md': 'Bar2 content',
				'qux2.md': 'Qux2 content',
				'quux.md': 'Quux content',
			} );
			const module = new DeclarationReflection( 'Test module', ReflectionKind.Module, project );
			appendChildren( project, module );
			const nodes = [
				pageReflection( 'Test module', module, a => [
					pageReflection( 'bar', a, b => [
						pageReflection( 'bar2', b ),
					] ),
					menuReflection( 'qux', a, b => [
						pageReflection( 'qux2', b ),
					] ),
				] ),
			] as const;
			const pages = [
				nodes[0].children[0],
				nodes[0].children[0].children[0],
				nodes[0].children[1].children[0],
			];
			const moduleChildren = [
				nodes[0].children[0],
				nodes[0].children[1],
			];
			const evt = new RendererEvent( 'test', 'test', project );
			evt.urls = [ new UrlMapping( module.name, module, () => '' ) ];
			const mappings = testHost.generateMappings( evt, nodes );
			expect( mappings ).toHaveLength( pages.length );
			expect( mappings ).toIncludeSameMembers( pages.map( p => matchMapping( p ) ) );
			expect( filterReflections( module.children ) ).toIncludeSameMembers( filterReflections( moduleChildren ) );
		} );
		it( 'should map pages correctly to module & project', () => {
			setVirtualFs( {
				'Test module.md': 'Test module content',
				'bar.md': 'Bar content',
				'bar2.md': 'Bar2 content',
				'qux2.md': 'Qux2 content',
				'quux.md': 'Quux content',
			} );
			const module = new DeclarationReflection( 'Test module', ReflectionKind.Module, project );
			appendChildren( project, module );
			const nodes = [
				pageReflection( 'Test module', module, a => [
					pageReflection( 'bar', a, b => [
						pageReflection( 'bar2', b ),
					] ),
					menuReflection( 'qux', a, b => [
						pageReflection( 'qux2', b ),
					] ),
				] ),
				menuReflection( 'baaz', project, a => [
					pageReflection( 'quux', a ),
				] ),
			] as const;
			const pages = [
				nodes[0].children[0],
				nodes[0].children[0].children[0],
				nodes[0].children[1].children[0],
				nodes[1].children[0],
			];
			const moduleChildren = [
				nodes[0].children[0],
				nodes[0].children[1],
			];
			const projectChildren = [
				module,
				nodes[1],
			];
			const evt = new RendererEvent( 'test', 'test', project );
			evt.urls = [ new UrlMapping( module.name, module, () => '' ) ];
			const mappings = testHost.generateMappings( evt, nodes );
			expect( mappings ).toHaveLength( pages.length );
			expect( mappings ).toIncludeSameMembers( pages.map( p => matchMapping( p ) ) );
			expect( filterReflections( module.children ) ).toIncludeSameMembers( filterReflections( moduleChildren ) );
			expect( filterReflections( project.children ) ).toIncludeSameMembers( filterReflections( projectChildren ) );
		} );
	} );
} );
