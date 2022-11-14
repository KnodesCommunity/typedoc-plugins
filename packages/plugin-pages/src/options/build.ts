import assert from 'assert';

import { isArray, isNil } from 'lodash';
import { LogLevel, ParameterType } from 'typedoc';

import { OptionGroup } from '@knodes/typedoc-pluginutils';

import { AnyLoaderRawPageNode, IBaseRawNode, NodePath, RootNodeLoader } from '../converter/loaders';
import type { PagesPlugin } from '../plugin';
import { EInvalidPageLinkHandling, IPluginOptions } from './types';

export const validatePages = ( plugin: PagesPlugin, nodeLoader: RootNodeLoader ) => ( value: unknown ): asserts value is AnyLoaderRawPageNode[] => {
	try {
		const recurse = ( upPath: NodePath, node: IBaseRawNode, recursionPath: NodePath ): asserts node is IBaseRawNode => {
			const newPath = [ ...upPath, ...recursionPath ];
			nodeLoader.checkConfigNode( node, { recurse: recurse.bind( null, newPath ), path: newPath } );
		};
		assert( isArray( value ) || isNil( value ) );
		value?.forEach( ( p, i ) => recurse( [], p, [ '#', i ] ) );
	} catch( e ){
		plugin.logger.warn( `Options given does not match the new definition format. If you set "useLegacyTreeBuilder", you can ignore this error. ${e}` );
	}
};

export const buildOptions = ( plugin: PagesPlugin, nodeLoader: RootNodeLoader ) => OptionGroup.factory<IPluginOptions>( plugin )
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
		validate: validatePages( plugin, nodeLoader ),
	}, v => {
		v = v ?? [];
		return v as any;
	} )
	.add( 'output', {
		help: 'Output directory where your pages will be rendered. This must be a relative path.',
		type: ParameterType.String,
		defaultValue: 'pages',
	}, v => plugin.relativeToRoot( v ) )
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
	.add( 'diagnostics', {
		help: 'The directory name where to output diagnostics data.',
		type: ParameterType.String,
		defaultValue: undefined,
	} )
	.build();
