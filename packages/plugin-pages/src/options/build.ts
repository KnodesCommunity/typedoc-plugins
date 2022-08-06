import assert from 'assert';

import { LogLevel, ParameterType } from 'typedoc';

import { OptionGroup } from '@knodes/typedoc-pluginutils';

import type { PagesPlugin } from '../plugin';
import { validatePages } from './pages';
import { EInvalidPageLinkHandling, IPluginOptions } from './types';

export const buildOptions = ( plugin: PagesPlugin ) => OptionGroup.factory<IPluginOptions>( plugin )
	.add( 'enablePageLinks', {
		help: 'Whether or not @page and @pagelink tags should be parsed.',
		type: ParameterType.Boolean,
		defaultValue: true,
	} )
	.add( 'enableSearch', {
		help: 'Whether or not the pages should be added to the search index.',
		type: ParameterType.Boolean,
		defaultValue: true,
	} )
	.add( 'invalidPageLinkHandling', {
		help: 'The kind of error to throw in case of an invalid page link.',
		type: ParameterType.Map,
		map: EInvalidPageLinkHandling,
		defaultValue: EInvalidPageLinkHandling.LOG_ERROR,
	} )
	.add( 'pages', {
		help: 'Actual pages definitions.',
		type: ParameterType.Mixed,
		validate: validatePages( plugin ),
	}, v => {
		v = v ?? [];
		return v as any;
	} )
	.add( 'output', {
		help: 'Output directory where your pages will be rendered. This must be a relative path.',
		type: ParameterType.String,
		defaultValue: 'pages',
	}, v => plugin.relativeToRoot( v ) )
	.add( 'source', {
		help: 'Root directory where all page source files live.',
		type: ParameterType.String,
		defaultValue: 'pages',
	}, v => v || null )
	.add( 'logLevel', {
		help: 'The plugin log level.',
		type: ParameterType.Map,
		map: LogLevel,
		defaultValue: plugin.application.logger.level,
	} )
	.add( 'excludeMarkdownTags', {
		help: 'A list of markdown captures to omit. Should have the form `{@....}`.',
		type: ParameterType.Array,
		validate: patterns => patterns?.forEach( p => assert.match( p, /^\{@.*\}$/, `Pattern ${JSON.stringify( p )} should match "{@...}"` ) ),
	}, v => v ?? [] )
	.add( 'linkModuleBase', {
		help: 'The container in packages to search for pages in "{@link ...}" tags.',
		type: ParameterType.String,
	}, v => v || null )
	.build();
