import { AssertionError } from 'assert';
import { resolve } from 'path';

import { noop } from 'lodash';
import { DeclarationReflection, ReflectionKind, normalizePath } from 'typedoc';

import { MockPlugin, createMockProjectWithPackage, mockPlugin, setupMockMarkdownReplacer, setupMockPageMemo } from '#plugintestbed';

import { EInvalidPageLinkHandling } from '../options';
import { PagesPlugin } from '../plugin';
import { MarkdownPagesLinks } from './markdown-links';

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
	it( 'should handle error correctly on mode FAIL', () => {
		plugin.pluginOptions.getValue().invalidPageLinkHandling = EInvalidPageLinkHandling.FAIL;
		expect( () => markdownReplacerTestbed.runMarkdownReplace( '{@page NOPE}' ) )
			.toThrowWithMessage( Error as any, `In "test.ts:1:1" (in expansion of @page): ${msg}` );
	} );
	it( 'should handle error correctly on mode LOG_ERROR', () => {
		plugin.logger.error.mockImplementation( noop );
		plugin.pluginOptions.getValue().invalidPageLinkHandling = EInvalidPageLinkHandling.LOG_ERROR;
		markdownReplacerTestbed.runMarkdownReplace( '{@page NOPE}' );
		expect( plugin.logger.error ).toHaveBeenCalledTimes( 1 );
		expect( plugin.logger.error ).toHaveBeenCalledWith( `In "test.ts:1:1" (in expansion of @page): ${msg}` );
	} );
	it( 'should handle error correctly on mode LOG_WARN', () => {
		plugin.logger.warn.mockImplementation( noop );
		plugin.pluginOptions.getValue().invalidPageLinkHandling = EInvalidPageLinkHandling.LOG_WARN;
		markdownReplacerTestbed.runMarkdownReplace( '{@page NOPE}' );
		expect( plugin.logger.warn ).toHaveBeenCalledTimes( 1 );
		expect( plugin.logger.warn ).toHaveBeenCalledWith( `In "test.ts:1:1" (in expansion of @page): ${msg}` );
	} );
	it( 'should handle error correctly on mode NONE', () => {
		plugin.pluginOptions.getValue().invalidPageLinkHandling = EInvalidPageLinkHandling.NONE;
		markdownReplacerTestbed.runMarkdownReplace( '{@page NOPE}' );
		expect( plugin.logger.verbose ).toHaveBeenCalledTimes( 1 );
		expect( plugin.logger.verbose ).toHaveBeenCalledWith( `In "test.ts:1:1" (in expansion of @page): ${msg}` );
	} );
	it.failing( 'should throw with invalid option', () => { // TODO: Restore once https://github.com/jest-community/jest-extended/pull/475 is merged
		plugin.pluginOptions.getValue().invalidPageLinkHandling = 42 as any;
		expect( () => markdownReplacerTestbed.runMarkdownReplace( '{@page NOPE}' ) )
			.toThrowWithMessage(
				AssertionError as any,
				'Invalid `invalidPageLinkHandling` option value 42' );
	} );
} );
