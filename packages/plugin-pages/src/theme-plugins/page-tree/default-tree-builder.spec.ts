import { Application, DeclarationReflection, DefaultTheme, ProjectReflection, RendererEvent, UrlMapping } from 'typedoc';

import { restoreFs, setVirtualFs } from '#plugintestbed';

import { PagesPlugin } from '../../plugin';
import { MenuReflection, NodeReflection, PageReflection, PagesPluginReflectionKind } from '../../reflections';
import { ANodeReflection } from '../../reflections/a-node-reflection';
import { DefaultTreeBuilder } from './default-tree-builder';

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
type Children = undefined | readonly [] | readonly [Dec, ...Dec[]];
type Dec<T extends DeclarationReflection = DeclarationReflection, Child extends Children = undefined> = Omit<T, 'children'> & {children: Child}
const pageReflection = <T extends Children = undefined>(
	name: string,
	parent: Dec | ProjectReflection,
	children?: ( r: Dec<PageReflection> ) => T,
): Dec<PageReflection, T> => {
	const r = new PageReflection( name, PagesPluginReflectionKind.PAGE as any, parent instanceof ANodeReflection ? parent.module : parent, parent, `${name}.md`, `${name}.html` ) as any;
	r.children = children?.( r );
	return r as any;
};
const menuReflection = <T extends undefined | readonly [] | readonly [Dec, ...Dec[]] = undefined>(
	name: string,
	parent: Dec | ProjectReflection,
	children?: ( r: Dec<MenuReflection> ) => T,
): Dec<MenuReflection, T> => {
	const r = new MenuReflection( name, PagesPluginReflectionKind.MENU as any, parent instanceof ANodeReflection ? parent.module : parent, parent ) as any;
	r.children = children?.( r );
	return r as any;
};
const matchMapping = ( page: PageReflection ) => expect.objectContaining( { url: page.url, model: page, template: testHost.renderPage } as Partial<UrlMapping> );
describe( DefaultTreeBuilder.name, () => {
	describe( 'Mappings generation', () => {
		it( 'should return empty list', () => {
			const evt = new RendererEvent( 'test', 'test', new ProjectReflection( 'Test' ) );
			expect( testHost.generateMappings( evt, [] ) ).toEqual( [] );
		} );
		it( 'should map only pages correctly', () => {
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
			const evt = new RendererEvent( 'test', 'test', new ProjectReflection( 'Test' ) );
			const mappings = testHost.generateMappings( evt, nodes );
			expect( mappings ).toHaveLength( 3 );
			expect( mappings ).toIncludeSameMembers( pages.map( p => matchMapping( p ) ) );
			pages.forEach( p => {
				expect( p.children ).toBeUndefined();
			} );
		} );
	} );
} );
