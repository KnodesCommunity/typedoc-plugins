import { noop } from 'lodash';
import { Application } from 'typedoc';

import { OptionGroup } from '@knodes/typedoc-pluginutils';

import { IPluginOptions, IRootPageNode } from './types';
import { PagesPlugin } from '../plugin';

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
	it( 'should not throw if empty pages list', () => expect( () => options.setValue( { pages: [] as IRootPageNode[] } ) )
		.not.toThrow( 'Every root pages should set `moduleRoot` to true, or none' ) );
	it( 'should throw if inconsistent "moduleRoot" option given', () => expect( () => options.setValue( { pages: [
		{ name: 'A', moduleRoot: true },
		{ name: 'B' },
	] as IRootPageNode[] } ) ).toThrow( 'Every root pages should set `moduleRoot` to true, or none' ) );
	it( 'should throw if multiple "moduleRoot" are equal', () => expect( () => options.setValue( { pages: [
		{ name: 'A', moduleRoot: true },
		{ name: 'A', moduleRoot: true },
	] as IRootPageNode[] } ) ).toThrow( 'Every root pages should have a different name' ) );
	it( 'should warn if using legacy "title" property (#133)', () => {
		options.setValue( { pages: [
			{ title: 'A' },
		] } );
		expect( application.logger.warn ).toHaveBeenCalledTimes( 1 );
		expect( application.logger.warn ).toHaveBeenCalledWith( expect.toInclude( 'Page "A" is using deprecated "title" property. Use "name" instead.' ) );
	} );
} );
