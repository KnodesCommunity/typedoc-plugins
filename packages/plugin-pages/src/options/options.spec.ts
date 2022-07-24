import { noop } from 'lodash';
import { Application } from 'typedoc';

import { OptionGroup } from '@knodes/typedoc-pluginutils';

import { PagesPlugin } from '../plugin';
import { IPluginOptions, IRootPageNode } from './types';

let application: Application;
let plugin: PagesPlugin;
let options: OptionGroup<IPluginOptions, any>;
beforeEach( () => {
	application = new Application();
	jest.spyOn( application.logger, 'warn' ).mockImplementation( noop );
	jest.spyOn( application.logger, 'error' ).mockImplementation( noop );
	plugin = new PagesPlugin( application );
	options = plugin.pluginOptions;
} );

describe( 'Pages', () => {
	it( 'should throw if inconsistent "moduleRoot" option given', () => expect( () => options.setValue( { pages: [
		{ name: 'A', moduleRoot: true },
		{ name: 'B' },
	] as IRootPageNode[] } ) ).toThrow( 'Every root pages should set `moduleRoot` to true, or none' ) );
	it( 'should warn if using legacy "title" property (#133)', () => {
		options.setValue( { pages: [
			{ title: 'A' },
		] } );
		expect( application.logger.warn ).toHaveBeenCalledTimes( 1 );
		expect( application.logger.warn ).toHaveBeenCalledWith( expect.toInclude( 'Page "A" is using deprecated "title" property. Use "name" instead.' ) );
	} );
	describe( 'Glob', () => {
		it( 'should throw if page has a `match` property, but no `template`', () => {
			expect( () => options.setValue( { pages: [
				{ match: 'A' },
			] } ) ).toThrow( 'Page "Unnamed" has a "match" or "template" property, but it should have both or none' );
		} );
		it( 'should throw if page has a `template` property, but no `match`', () => {
			expect( () => options.setValue( { pages: [
				{ template: [] },
			] } ) ).toThrow( 'Page "Unnamed" has a "match" or "template" property, but it should have both or none' );
		} );
		it( 'should throw if page has a `template` property with invalid child', () => {
			expect( () => options.setValue( { pages: [
				{ match: 'foo', template: [
					{ asd: false },
				] },
			] } ) ).toThrow( 'Page "TEMPLATE 1" ⇒ "Unnamed" should have a name' );
		} );
		it( 'should check for root nodes through templates', () => {
			expect( () => options.setValue( { pages: [
				{ match: 'foo', template: [
					{ match: 'bar', template: [
						{ match: 'qux', template: [
							{ name: 'test' },
						] },
					] },
				] },
				{ moduleRoot: true, name: 'fail' },
			] } ) ).toThrow( 'Every root pages should set `moduleRoot` to true, or none' );
		} );

	} );
} );
