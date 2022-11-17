import { noop } from 'lodash';
import { DeclarationReflection, ProjectReflection, ReflectionKind, SourceReference } from 'typedoc';

import { resolve } from '@knodes/typedoc-pluginutils/path';

import { MockPlugin, createMockProjectWithPackage, mockPlugin, restoreFs, setVirtualFs, setupMockMarkdownReplacer, setupMockPageMemo } from '#plugintestbed';

import { PageReflection, PagesPluginReflectionKind } from '../models/reflections';
import { EInvalidPageLinkHandling } from '../options';
import { PagesPlugin } from '../plugin';
import { MarkdownPagesLinks } from './markdown-links';
import { IPagesPluginThemeMethods } from './theme';

let plugin: MockPlugin<PagesPlugin>;
const markdownReplacerTestbed = setupMockMarkdownReplacer();
const currentPageMemoTestbed = setupMockPageMemo();
beforeEach( () => {
	plugin = mockPlugin<PagesPlugin>();
	markdownReplacerTestbed.captureEventRegistration();
	currentPageMemoTestbed.captureEventRegistration();
} );
afterEach( restoreFs );

describe( 'Resolution', () => {
	let project: jest.MockedObject<ProjectReflection>;
	const mockThemeMethods: jest.Mocked<IPagesPluginThemeMethods> = {
		renderPageLink: jest.fn().mockReturnValue( 'foo' ),
	};
	const getReflectionsByKindFactory = ( { modules, pages }: {modules?: DeclarationReflection[]; pages?: PageReflection[]} = {} ) =>
		jest.fn().mockImplementation( kind => {
			if( kind === ReflectionKind.Module ){
				return modules ?? [];
			} else if( kind === PagesPluginReflectionKind.PAGE ){
				return pages ?? [];
			} else {
				throw new Error();
			}
		} );
	beforeEach( () => {
		plugin.pluginOptions.getValue().invalidPageLinkHandling = EInvalidPageLinkHandling.FAIL;
		project = jest.mocked( createMockProjectWithPackage() );
	} );
	describe( 'Successful resolution', () => {
		let mockPage: jest.Mocked<PageReflection>;
		beforeEach( () => {
			mockPage = Object.create( PageReflection.prototype );
			jest.spyOn( mockPage, 'matchVirtualPath' ).mockReturnValue( true );
		} );
		describe.each( [
			[ null, '' ],
			[ 'test', 'test/' ],
		] )( 'Alias & shorthands support for linkModuleBase %o', ( linkModuleBase, pathPrefix ) => {
			beforeEach( () => {
				plugin.pluginOptions.getValue().linkModuleBase = linkModuleBase;
			} );
			it.each( [
				[ '~', '~~:~' ],
				[ '~:foo', `~~:${pathPrefix}foo` ],
				[ 'foo', `~~:${pathPrefix}foo` ],
			] )( 'should convert %s to %s on project root', ( source, expected ) => {
				project.getReflectionsByKind = getReflectionsByKindFactory( { pages: [ mockPage ] } );
				new MarkdownPagesLinks( plugin, mockThemeMethods, { project } as any );
				currentPageMemoTestbed.setCurrentPage( 'test', 'test.ts', new DeclarationReflection( 'test', ReflectionKind.Accessor, project ) );
				expect( markdownReplacerTestbed.runMarkdownReplace( `{@page ${source}}` ) ).toEqual( 'foo' );
				expect( mockPage.matchVirtualPath ).toHaveBeenCalledWith( expected );
			} );
			it.each( [
				[ '~', '~hello:hello' ],
				[ '~:foo', `~hello:${pathPrefix}foo` ],
				[ 'foo', `~hello:${pathPrefix}foo` ],
			] )( 'should convert %s to %s on module "hello"', ( source, expected ) => {
				setVirtualFs( { hello: { 'readme.md': 'Module A' }} );
				const module = Object.assign( new DeclarationReflection( 'hello', ReflectionKind.Module, project ), { sources: [
					new SourceReference( resolve( 'hello/readme.md' ), 1, 1 ),
				] } );
				project.getReflectionsByKind = getReflectionsByKindFactory( {
					modules: [ module ],
					pages: [ mockPage ],
				} );
				new MarkdownPagesLinks( plugin, mockThemeMethods, { project } as any );
				currentPageMemoTestbed.setCurrentPage(
					'test',
					'test.ts',
					Object.assign( new DeclarationReflection( 'test', ReflectionKind.Accessor, module ), { sources: [
						new SourceReference( resolve( 'hello/test.ts' ), 1, 1 ),
					] } ) );
				expect( markdownReplacerTestbed.runMarkdownReplace( `{@page ${source}}` ) ).toEqual( 'foo' );
				expect( mockPage.matchVirtualPath ).toHaveBeenCalledWith( expected );
			} );
			describe( 'Relative path support', () => {
				it( 'should resolve page in sibling module from module', () => {
					const wrapInLinkModuleBase = ( content: Record<string, string> ) => linkModuleBase ? { [linkModuleBase]: content } : content;
					setVirtualFs( {
						'module-a': wrapInLinkModuleBase( { 'readme.md': 'Module A' } ),
						'module-b': wrapInLinkModuleBase( { 'readme.md': 'Module B' } ),
					} );
					const modules = [
						Object.assign( new DeclarationReflection( 'module-a', ReflectionKind.Module, project ), { sources: [
							new SourceReference( resolve( 'module-a/readme.md' ), 1, 1 ),
						] } ),
						Object.assign( new DeclarationReflection( 'module-b', ReflectionKind.Module, project ), { sources: [
							new SourceReference( resolve( 'module-b/readme.md' ), 1, 1 ),
						] } ),
					];
					project.getReflectionsByKind = getReflectionsByKindFactory( { modules, pages: [ mockPage ] } );
					mockPage.matchVirtualPath.mockReturnValue( false ).mockReturnValueOnce( true );
					new MarkdownPagesLinks( plugin, mockThemeMethods, { project } as any );
					const sourceFile = resolve( `module-a/${pathPrefix}/foo/test.md` );
					const sourceUrl = 'test';
					currentPageMemoTestbed.setCurrentPage(
						sourceUrl,
						sourceFile,
						new PageReflection( 'hello', modules[0], modules[0], 'asdasd', sourceFile, sourceFile, sourceUrl ) );
					expect( markdownReplacerTestbed.runMarkdownReplace( `{@page ../../${pathPrefix ? '../' : ''}module-b/${pathPrefix}hello}` ) ).toEqual( 'foo' );
					expect( mockPage.matchVirtualPath ).toHaveBeenCalledWith( `~module-b:${pathPrefix}hello` );
				} );
			} );
		} );
	} );
	describe( 'Error handling', () => {
		const msg = 'Could not resolve page "NOPE" from reflection test: Error: Page not found';
		const location = 'In "test.ts:1:1" (in expansion of @page)';
		beforeEach( () => {
			project.getReflectionsByKind = getReflectionsByKindFactory();
			new MarkdownPagesLinks( plugin, {} as any, { project } as any );
			currentPageMemoTestbed.setCurrentPage( 'test', 'test.ts', new DeclarationReflection( 'test', ReflectionKind.Accessor, project ) );
		} );
		it( 'should handle error correctly on mode FAIL', () => {
			plugin.pluginOptions.getValue().invalidPageLinkHandling = EInvalidPageLinkHandling.FAIL;
			expect( () => markdownReplacerTestbed.runMarkdownReplace( '{@page NOPE}' ) )
				.toThrowWithMessage( Error as any, `${location}: ${msg}` );
		} );
		it( 'should handle error correctly on mode LOG_ERROR', () => {
			plugin.logger.error.mockImplementation( noop );
			plugin.pluginOptions.getValue().invalidPageLinkHandling = EInvalidPageLinkHandling.LOG_ERROR;
			markdownReplacerTestbed.runMarkdownReplace( '{@page NOPE}' );
			expect( plugin.logger.error ).toHaveBeenCalledTimes( 1 );
			expect( plugin.logger.error ).toHaveBeenCalledWith( `${location}: ${msg}` );
		} );
		it( 'should handle error correctly on mode LOG_WARN', () => {
			plugin.logger.warn.mockImplementation( noop );
			plugin.pluginOptions.getValue().invalidPageLinkHandling = EInvalidPageLinkHandling.LOG_WARN;
			markdownReplacerTestbed.runMarkdownReplace( '{@page NOPE}' );
			expect( plugin.logger.warn ).toHaveBeenCalledTimes( 1 );
			expect( plugin.logger.warn ).toHaveBeenCalledWith( `${location}: ${msg}` );
		} );
		it( 'should handle error correctly on mode NONE', () => {
			plugin.pluginOptions.getValue().invalidPageLinkHandling = EInvalidPageLinkHandling.NONE;
			markdownReplacerTestbed.runMarkdownReplace( '{@page NOPE}' );
			expect( plugin.logger.verbose ).toHaveBeenCalledTimes( 1 );
			expect( plugin.logger.verbose ).toHaveBeenCalledWith( `${location}: ${msg}` );
		} );
		it( 'should throw with invalid option', () => {
			plugin.pluginOptions.getValue().invalidPageLinkHandling = 42 as any;
			expect( () => markdownReplacerTestbed.runMarkdownReplace( '{@page NOPE}' ) )
				.toThrowWithMessage(
					Error,
					`${location}: Invalid \`invalidPageLinkHandling\` option value 42` );
		} );
	} );
} );
