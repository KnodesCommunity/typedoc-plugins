import { Application, DeclarationReflection, DefaultTheme, UrlMapping } from 'typedoc';

import { PagesPlugin } from '../plugin';
import { MenuReflection, NodeReflection, PageReflection, PagesPluginReflectionKind } from '../reflections';
import { FallbackPageTreeBuilder } from './fallback-page-tree-builder';

class TestHost extends FallbackPageTreeBuilder {
	// eslint-disable-next-line @typescript-eslint/dot-notation
	public renderPage = this['_renderPage'];

	public constructor(){
		super( theme, application.options.getValue( 'theme' ), plugin );
	}

	public override generateMappings( reflections: readonly NodeReflection[] ): Array<UrlMapping<PageReflection>> {
		return super.generateMappings( reflections );
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
type Children = undefined | readonly [] | readonly [Dec, ...Dec[]];
type Dec<T extends DeclarationReflection = DeclarationReflection, Child extends Children = undefined> = Omit<T, 'children'> & {children: Child}
const pageReflection = <T extends Children = undefined>(
	name: string,
	parent: Dec | undefined,
	children?: ( r: Dec<PageReflection> ) => T,
): Dec<PageReflection, T> => {
	const r = new PageReflection( name, PagesPluginReflectionKind.PAGE as any, name, name, `${name}.html`, parent ) as any;
	r.children = children?.( r );
	return r as any;
};
const menuReflection = <T extends undefined | readonly [] | readonly [Dec, ...Dec[]] = undefined>(
	name: string,
	parent: Dec | undefined,
	children?: ( r: Dec<MenuReflection> ) => T,
): Dec<MenuReflection, T> => {
	const r = new MenuReflection( name, PagesPluginReflectionKind.MENU as any, parent ) as any;
	r.children = children?.( r );
	return r as any;
};
const matchMapping = ( page: PageReflection ) => expect.objectContaining( { url: page.url, model: page, template: testHost.renderPage } as Partial<UrlMapping> );
describe( FallbackPageTreeBuilder.name, () => {
	describe( 'Mappings generation', () => {
		it( 'should return empty list', () => {
			expect( testHost.generateMappings( [] ) ).toEqual( [] );
		} );
		it( 'should map only pages correctly', () => {
			const nodes = [
				pageReflection( 'foo', undefined, a => [
					pageReflection( 'bar', a ),
					menuReflection( 'qux', a ),
				] ),
				menuReflection( 'baaz', undefined, a => [
					pageReflection( 'quux', a ),
				] ),
			] as const;
			const pages = [
				nodes[0],
				nodes[0].children[0],
				nodes[1].children[0],
			];
			const mappings = testHost.generateMappings( nodes );
			expect( mappings ).toHaveLength( 3 );
			expect( mappings ).toIncludeSameMembers( pages.map( p => matchMapping( p ) ) );
			pages.forEach( p => {
				expect( p.children ).toBeUndefined();
			} );
		} );
	} );
} );
