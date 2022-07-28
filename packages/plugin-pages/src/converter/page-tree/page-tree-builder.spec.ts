import { resolve } from 'path';

import { isString, noop, omit } from 'lodash';
import { Class } from 'type-fest';
import { DeclarationReflection, LogLevel, ProjectReflection, Reflection, ReflectionKind, SourceReference, normalizePath } from 'typedoc';

import { MockPlugin, createMockProjectWithPackage, mockPlugin, restoreFs, setVirtualFs } from '#plugintestbed';

import { MenuReflection, PageReflection } from '../../models/reflections';
import { EInvalidPageLinkHandling, IPluginOptions } from '../../options';
import { PagesPlugin } from '../../plugin';
import { PageTreeBuilder } from './page-tree-builder';

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
	source: '',
} as IPluginOptions );
beforeEach( () => {
	plugin = mockPlugin<PagesPlugin>();
	Object.assign( plugin.application.options.getRawValues(), {
		entryPoints: [ normalizePath( process.cwd() ) ],
	} );
	pageTreeBuilder = new PageTreeBuilder( plugin );
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
	return moduleRef;
};
const matchReflection = <T extends Reflection>( proto: Class<T>, sample: Omit<Partial<T>, 'childrenNodes'> & {childrenNodes?: jest.Result[]} ) => expect.toSatisfy( v => {
	expect( v ).toBeInstanceOf( proto );
	const s = sample as any;
	if( 'sourceFilePath' in s && isString( s.sourceFilePath ) ){
		s.sourceFilePath = normalizePath( resolve( s.sourceFilePath ) );
	}
	const cloneValue = Object.keys( omit( sample, 'childrenNodes' ) ).reduce( ( acc, k ) => ( { ...acc, [k]: v[k] } ), {} );
	expect( cloneValue ).toMatchObject( omit( sample, 'childrenNodes' ) );
	const children = ( sample as any ).childrenNodes;
	if( children ){
		expect( v.childrenNodes ).toHaveLength( children.length );
		expect( v.childrenNodes ).toSatisfyAll( c => c.parent === v );
		expect( v.childrenNodes ).toEqual( children );
	} else {
		expect( v.childrenNodes ).toEqual( [] );
	}
	return true;
} );

describe( 'Path composition', () => {
	it( 'should compose correctly implicit nesting', () => {
		setVirtualFs( {
			'foo.md': 'Foo content',
			'foo': {
				'bar.md': 'Bar content',
			},
		} );
		const out = pageTreeBuilder.buildPagesTree( project, opts( [ { name: 'Foo', source: 'foo.md', children: [
			{ name: 'Bar', source: 'bar.md' },
		]  } ] ) );
		expect( out.childrenNodes![0].childrenNodes![0] ).toMatchObject( {
			sourceFilePath: normalizePath( resolve( 'foo.md' ) ),
			url: 'foo/index.html',
		} );
		expect( out.childrenNodes![0].childrenNodes![0].childrenNodes![0] ).toMatchObject( {
			sourceFilePath: normalizePath( resolve( 'foo/bar.md' ) ),
			url: 'foo/bar.html',
		} );
	} );
	it( 'should compose correctly explicit nesting', () => {
		setVirtualFs( {
			'foo.md': 'Foo content',
			'SRC': {
				'bar.md': 'Bar content',
			},
		} );
		const out = pageTreeBuilder.buildPagesTree( project, opts( [ { name: 'Foo', source: 'foo.md', childrenSourceDir: 'SRC', childrenOutputDir: 'OUT', children: [
			{ name: 'Bar', source: 'bar.md' },
		]  } ] ) );
		expect( out.childrenNodes![0].childrenNodes![0] ).toMatchObject( {
			sourceFilePath: normalizePath( resolve( 'foo.md' ) ),
			url: 'foo.html',
		} );
		expect( out.childrenNodes![0].childrenNodes![0].childrenNodes![0] ).toMatchObject( {
			sourceFilePath: normalizePath( resolve( 'SRC/bar.md' ) ),
			url: 'OUT/bar.html',
		} );
	} );
	it( 'should compose correctly explicit nesting via childrenDir', () => {
		setVirtualFs( {
			'foo.md': 'Foo content',
			'CHILD': {
				'bar.md': 'Bar content',
			},
		} );
		const out = pageTreeBuilder.buildPagesTree( project, opts( [ { name: 'Foo', source: 'foo.md', childrenDir: 'CHILD', children: [
			{ name: 'Bar', source: 'bar.md' },
		]  } ] ) );
		expect( out.childrenNodes![0].childrenNodes![0] ).toMatchObject( {
			sourceFilePath: normalizePath( resolve( 'foo.md' ) ),
			url: 'foo.html',
		} );
		expect( out.childrenNodes![0].childrenNodes![0].childrenNodes![0] ).toMatchObject( {
			sourceFilePath: normalizePath( resolve( 'CHILD/bar.md' ) ),
			url: 'CHILD/bar.html',
		} );
	} );
} );
describe( 'Simple tree', () => {
	describe( 'Project', () => {
		it( 'should map simple page', () => {
			setVirtualFs( {
				'foo.md': 'Foo content',
			} );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [ { name: 'Foo', source: 'foo.md'  } ] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( MenuReflection, { name: 'TEST', depth: 0, module: project, childrenNodes: [
					matchReflection( PageReflection, { name: 'Foo', depth: 1, module: project } ),
				] } ),
			] );
		} );
		it( 'should strip empty menu', () => {
			plugin.logger.warn.mockImplementation( noop );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [ { name: 'Foo' } ] ) );
			expect( out.childrenNodes ).toEqual( [] );
		} );
		it( 'should map menu with children', () => {
			setVirtualFs( {
				'bar.md': 'Bar content',
				'baz.md': 'Baz content',
			} );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [ { name: 'Foo', children: [
				{ name: 'Bar', source: 'bar.md' },
				{ name: 'Baz', source: 'baz.md' },
			] } ] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( MenuReflection, { name: 'TEST', depth: 0, module: project, childrenNodes: [
					matchReflection( MenuReflection, { name: 'Foo', depth: 1, module: project, childrenNodes: [
						matchReflection( PageReflection, { name: 'Bar', depth: 2, module: project, sourceFilePath: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
						matchReflection( PageReflection, { name: 'Baz', depth: 2, module: project, sourceFilePath: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
					] } ),
				] } ),
			] );
		} );
		it( 'should map virtual menu with no children', () => {
			const out = pageTreeBuilder.buildPagesTree( project, opts( [ { name: 'VIRTUAL', children: [] } ] ) );
			expect( out.childrenNodes ).toEqual( [] );
		} );
		it( 'should map virtual menu with children', () => {
			setVirtualFs( {
				'bar.md': 'Bar content',
				'baz.md': 'Baz content',
			} );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [ { name: 'VIRTUAL', children: [
				{ name: 'Bar', source: 'bar.md' },
				{ name: 'Baz', source: 'baz.md' },
			] } ] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( MenuReflection, { name: 'TEST', depth: 0, module: project, childrenNodes: [
					matchReflection( PageReflection, { name: 'Bar', depth: 1, module: project, sourceFilePath: 'bar.md', content: 'Bar content', url: 'bar.html' } ),
					matchReflection( PageReflection, { name: 'Baz', depth: 1, module: project, sourceFilePath: 'baz.md', content: 'Baz content', url: 'baz.html' } ),
				] } ),
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
			const out = pageTreeBuilder.buildPagesTree( project, opts( [ { name: 'Foo', source: 'foo.md', children: [
				{ name: 'Bar', source: 'bar.md' },
				{ name: 'Baz', source: 'baz.md' },
			] } ] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( MenuReflection, { name: 'TEST', depth: 0, module: project, childrenNodes: [
					matchReflection( PageReflection, { name: 'Foo', depth: 1, module: project, sourceFilePath: 'foo.md', content: 'Foo content', url: 'foo/index.html',  childrenNodes: [
						matchReflection( PageReflection, { name: 'Bar', depth: 2, module: project, sourceFilePath: 'foo/bar.md', content: 'Bar content', url: 'foo/bar.html' } ),
						matchReflection( PageReflection, { name: 'Baz', depth: 2, module: project, sourceFilePath: 'foo/baz.md', content: 'Baz content', url: 'foo/baz.html' } ),
					] } ),
				] } ),
			] );
		} );
	} );
	describe( 'Workspace', () => {
		it( 'should map menu to workspace with children', () => {
			const targetModule = addChildModule( 'SUB' );
			addChildModule( 'SUB2' );
			setVirtualFs( {
				SUB: {
					'bar.md': 'Bar content',
					'baz.md': 'Baz content',
					'package.json': '',
				},
			} );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [ { name: 'SUB', moduleRoot: true, children: [
				{ name: 'Bar', source: 'bar.md' },
				{ name: 'Baz', source: 'baz.md' },
			] } ] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( MenuReflection, { name: 'SUB', depth: 0, module: targetModule,  childrenNodes: [
					matchReflection( PageReflection, { name: 'Bar', depth: 1, module: targetModule, sourceFilePath: 'SUB/bar.md', content: 'Bar content', url: 'SUB/bar.html' } ),
					matchReflection( PageReflection, { name: 'Baz', depth: 1, module: targetModule, sourceFilePath: 'SUB/baz.md', content: 'Baz content', url: 'SUB/baz.html' } ),
				] } ),
			] );
		} );
		it( 'should map page to workspace with children with pages at root', () => {
			addChildModule( 'SUB' );
			const targetModule = addChildModule( 'SUB2' );
			setVirtualFs( {
				SUB2: {
					'appendix.md': 'APPENDIX',
					'bar.md': 'Bar content',
					'baz.md': 'Baz content',
				},
			} );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [ { name: 'SUB2', moduleRoot: true, source: 'appendix.md', children: [
				{ name: 'Bar', source: 'bar.md' },
				{ name: 'Baz', source: 'baz.md' },
			] } ] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( PageReflection, { name: 'SUB2', depth: 0, module: targetModule, sourceFilePath: 'SUB2/appendix.md', childrenNodes: [
					matchReflection( PageReflection, { name: 'Bar', depth: 1, module: targetModule, sourceFilePath: 'SUB2/bar.md', content: 'Bar content', url: 'SUB2/bar.html' } ),
					matchReflection( PageReflection, { name: 'Baz', depth: 1, module: targetModule, sourceFilePath: 'SUB2/baz.md', content: 'Baz content', url: 'SUB2/baz.html' } ),
				] } ),
			] );
		} );
	} );
	describe( 'Mixed', () => {
		it( 'should map appendixes to workspace and root', () => {
			const sub1 = addChildModule( 'SUB1' );
			const sub2 = addChildModule( 'SUB2' );
			setVirtualFs( {
				'appendix.md': 'APPENDIX',
				'SUB1': {
					'appendix.md': 'APPENDIX',
				},
				'SUB2': {
					'appendix.md': 'APPENDIX',
				},
			} );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [
				{ name: project.name, moduleRoot: true, source: 'appendix.md' },
				{ name: 'SUB1', moduleRoot: true, source: 'appendix.md' },
				{ name: 'SUB2', moduleRoot: true, source: 'appendix.md' },
			] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( PageReflection, { name: project.name, depth: 0, module: project, sourceFilePath: 'appendix.md' } ),
				matchReflection( PageReflection, { name: 'SUB1', depth: 0, module: sub1, sourceFilePath: 'SUB1/appendix.md' } ),
				matchReflection( PageReflection, { name: 'SUB2', depth: 0, module: sub2, sourceFilePath: 'SUB2/appendix.md' } ),
			] );
		} );
		it( 'should map pages to workspace and root', () => {
			const sub1 = addChildModule( 'SUB1' );
			const sub2 = addChildModule( 'SUB2' );
			setVirtualFs( {
				'foo.md': 'Page',
				'SUB1': {
					'baz.md': 'Page',
				},
				'SUB2': {
					'qux.md': 'Page',
				},
			} );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [
				{ name: project.name, moduleRoot: true, children: [
					{ name: 'Page Foo', source: 'foo.md' },
				] },
				{ name: 'SUB1', moduleRoot: true, children: [ { name: 'Page Baz', source: 'baz.md' } ] },
				{ name: 'SUB2', moduleRoot: true, children: [ { name: 'Page Qux', source: 'qux.md' } ] },
			] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( MenuReflection, { name: project.name, depth: 0, module: project, childrenNodes: [
					matchReflection( PageReflection, { name: 'Page Foo', depth: 1, module: project, sourceFilePath: 'foo.md' } ),
				] } ),
				matchReflection( MenuReflection, { name: 'SUB1', depth: 0, module: sub1, childrenNodes: [
					matchReflection( PageReflection, { name: 'Page Baz', depth: 1, module: sub1, sourceFilePath: 'SUB1/baz.md' } ),
				] } ),
				matchReflection( MenuReflection, { name: 'SUB2', depth: 0, module: sub2, childrenNodes: [
					matchReflection( PageReflection, { name: 'Page Qux', depth: 1, module: sub2, sourceFilePath: 'SUB2/qux.md' } ),
				] } ),
			] );
		} );
	} );
} );
describe( 'Glob expansion', () => {
	// See https://github.com/KnodesCommunity/typedoc-plugins/issues/132
	describe( 'String template interpolation', () => {
		it( 'should expand properly pages', () => {
			setVirtualFs( {
				'test-foo': { 'readme.md': 'Foo content' },
				'test-bar': { 'readme.md': 'Bar content' },
			} );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [ { match: '*/readme.md', template: [
				// eslint-disable-next-line no-template-curly-in-string
				{ name: '<%= _.startCase( path.dirname( context.match )) %>', source: '${ context.fullPath }'  },
			] } ] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( MenuReflection, { name: 'TEST', depth: 0, module: project, childrenNodes: [
					matchReflection( PageReflection, { name: 'Test Bar', content: 'Bar content', depth: 1, module: project } ),
					matchReflection( PageReflection, { name: 'Test Foo', content: 'Foo content', depth: 1, module: project } ),
				] } ),
			] );
		} );
		it( 'should expand properly sub items', () => {
			setVirtualFs( {
				packages: {
					foo: { 'readme.md': 'Foo content' },
					bar: { 'readme.md': 'Bar content' },
				},
			} );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [ { match: 'packages/*', template: [
				// eslint-disable-next-line no-template-curly-in-string
				{ name: '<%= _.startCase( path.basename( context.match ) ) %>', childrenDir: '${context.match}', children: [
					// eslint-disable-next-line no-template-curly-in-string
					{ source: '${ context.fullPath }/readme.md', name: '<%= _.startCase( path.basename( context.match ) ) %> child' },
				] },
			] } ] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( MenuReflection, { name: 'TEST', depth: 0, module: project, childrenNodes: [
					matchReflection( MenuReflection, { name: 'Bar', depth: 1, module: project, childrenNodes: [
						matchReflection( PageReflection, { name: 'Bar child', content: 'Bar content', depth: 2, module: project } ),
					] } ),
					matchReflection( MenuReflection, { name: 'Foo', depth: 1, module: project, childrenNodes: [
						matchReflection( PageReflection, { name: 'Foo child', content: 'Foo content', depth: 2, module: project } ),
					] } ),
				] } ),
			] );
		} );
		it( 'should expand properly nested items', () => {
			setVirtualFs( {
				packages: {
					foo: { 'readme.md': 'Foo content', 'Changelog.md': 'Foo changelog' },
					bar: { 'readme.md': 'Bar content', 'Changelog.md': 'Bar changelog' },
				},
			} );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [ { match: 'packages/*', template: [
				// eslint-disable-next-line no-template-curly-in-string
				{ name: '<%= _.startCase( path.basename( context.match ) ) %>', childrenDir: '${context.match}', children: [
					{ match: '*.md', template: [
						// eslint-disable-next-line no-template-curly-in-string
						{ source: '${ context.fullPath }', name: '<%= _.startCase( path.basename( context.prev[0].match ) + " " + path.basename( context.match, ".md" ) ) %>' },
					] },
				] },
			] } ] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( MenuReflection, { name: 'TEST', depth: 0, module: project, childrenNodes: [
					matchReflection( MenuReflection, { name: 'Bar', depth: 1, module: project, childrenNodes: [
						matchReflection( PageReflection, { name: 'Bar Changelog', content: 'Bar changelog', depth: 2, module: project } ),
						matchReflection( PageReflection, { name: 'Bar Readme', content: 'Bar content', depth: 2, module: project } ),
					] } ),
					matchReflection( MenuReflection, { name: 'Foo', depth: 1, module: project, childrenNodes: [
						matchReflection( PageReflection, { name: 'Foo Changelog', content: 'Foo changelog', depth: 2, module: project } ),
						matchReflection( PageReflection, { name: 'Foo Readme', content: 'Foo content', depth: 2, module: project } ),
					] } ),
				] } ),
			] );
		} );
		it( 'should merge properly nested items', () => {
			const targetModule = addChildModule( 'foo', 'packages/foo' );
			setVirtualFs( {
				packages: {
					foo: {
						'bar': {
							'readme.md': 'Foo content',
							'Changelog.md': 'Foo changelog',
						},
						'qux.md': 'Qux content',
					},
				},
			} );
			const out = pageTreeBuilder.buildPagesTree( project, opts( [
				{ match: 'packages/**/readme.md', template: [
					{ name: '<%= _.lowerCase( path.relative("packages", context.match ).split("/")[0] ) %>', moduleRoot: true, children: [
						{ name: 'Meta', children: [
							// eslint-disable-next-line no-template-curly-in-string
							{ source: '${ context.fullPath }', name: 'Readme' },
						] },
					] },
				] },
				{ match: 'packages/**/Changelog.md', template: [
					{ name: '<%= _.lowerCase( path.relative("packages", context.match ).split("/")[0] ) %>', moduleRoot: true, children: [
						{ name: 'Meta', children: [
							// eslint-disable-next-line no-template-curly-in-string
							{ source: '${ context.fullPath }', name: 'Changelog' },
						] },
					] },
				] },
				{ name: 'foo', moduleRoot: true, children: [
					{ source: 'qux.md', name: 'Qux' },
				] },
			] ) );
			expect( out.childrenNodes ).toEqual( [
				matchReflection( MenuReflection, { name: 'foo', depth: 0, module: targetModule, childrenNodes: [
					matchReflection( MenuReflection, { name: 'Meta', depth: 1, module: targetModule, childrenNodes: [
						matchReflection( PageReflection, { name: 'Readme', content: 'Foo content', depth: 2, module: targetModule } ),
						matchReflection( PageReflection, { name: 'Changelog', content: 'Foo changelog', depth: 2, module: targetModule } ),
					] } ),
					matchReflection( PageReflection, { name: 'Qux', content: 'Qux content', depth: 1, module: targetModule } ),
				] } ),
			] );
		} );
	} );
} );
