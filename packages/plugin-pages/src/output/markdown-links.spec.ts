import { noop } from 'lodash';
import { DeclarationReflection, ReflectionKind, normalizePath } from 'typedoc';

import { resolve } from '@knodes/typedoc-pluginutils/path';

import { MockPlugin, createMockProjectWithPackage, mockPlugin, setupMockMarkdownReplacer, setupMockPageMemo } from '#plugintestbed';

import { MarkdownPagesLinks } from './markdown-links';
import { EInvalidPageLinkHandling } from '../options';
import { PagesPlugin } from '../plugin';

let plugin: MockPlugin<PagesPlugin>;
const markdownReplacerTestbed = setupMockMarkdownReplacer();
const currentPageMemoTestbed = setupMockPageMemo();
beforeEach( () => {
	plugin = mockPlugin<PagesPlugin>();
	markdownReplacerTestbed.captureEventRegistration();
	currentPageMemoTestbed.captureEventRegistration();
	new MarkdownPagesLinks( plugin, {} as any, { project: { getReflectionsByKind: jest.fn().mockReturnValue( [] ) }} as any );
	const project = createMockProjectWithPackage();
	currentPageMemoTestbed.setCurrentPage( 'test', 'test.ts', new DeclarationReflection( 'test', ReflectionKind.Accessor, project ) );
} );

describe( 'Resolution error handling', () => {
	const msg = `Could not resolve page "NOPE" from reflection test: Could not resolve ${normalizePath( resolve( 'NOPE' ) )}`;
	const location = 'In "test.ts:1:1" (in expansion of @page)';
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
