import { Application } from 'typedoc';

import { OptionGroup } from '@knodes/typedoc-pluginutils';

import { PagesPlugin } from '../plugin';
import { IPluginOptions, IRootPageNode } from './types';

let application: Application;
let plugin: PagesPlugin;
let options: OptionGroup<IPluginOptions, any>;
beforeEach( () => {
	application = new Application();
	plugin = new PagesPlugin( application );
	options = plugin.pluginOptions;
} );

describe( 'Pages', () => {
	it( 'should throw if inconsistent "moduleRoot" option given', () => expect( () => options.setValue( { pages: [
		{ title: 'A', moduleRoot: true },
		{ title: 'B' },
	] as IRootPageNode[] } ) ).toThrow( 'Every root pages should set `moduleRoot` to true, or none' ) );
	it( 'should throw if multiple "moduleRoot" are equal', () => expect( () => options.setValue( { pages: [
		{ title: 'A', moduleRoot: true },
		{ title: 'A', moduleRoot: true },
	] as IRootPageNode[] } ) ).toThrow( 'Every root pages should have a different title' ) );
} );
