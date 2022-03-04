import assert, { AssertionError } from 'assert';

import { difference, isArray, isNil, isObject, isString } from 'lodash';
import { LogLevel, ParameterType } from 'typedoc';

import { OptionGroup, catchWrap } from '@knodes/typedoc-pluginutils';

import type { PagesPlugin } from '../plugin';
import { EInvalidPageLinkHandling, IPageNode, IPluginOptions } from './types';

const pageKeys: Array<keyof IPageNode> = [ 'children', 'childrenDir', 'childrenOutputDir', 'childrenSourceDir', 'output', 'source', 'title' ];
const wrapPageError = ( path: string[], index: number ) => ( err: any ) => {
	if( err instanceof AssertionError ){
		const pathStr = path.length > 0 ? ` in ${path.map( p => JSON.stringify( p ) ).join( ' ⇒ ' )}` : '';
		return `Invalid page${pathStr} @ index ${index}`;
	} else {
		return err;
	}
};
const checkPage = ( page: unknown, path: string[] ): asserts page is IPageNode => {
	assert( page && isObject( page ), 'Page should be an object' );
	const _page = page as Record<string, unknown>;
	assert( 'title' in _page && isString( _page.title ), 'Page should have a title' );
	const extraProps = difference( Object.keys( _page ), pageKeys );
	assert( extraProps.length === 0, `Page should not have extra props ${JSON.stringify( extraProps )}` );
	if( 'children' in _page && !isNil( _page.children ) ){
		assert( isArray( _page.children ), 'Page children should be an array' );
		const thisPath = [ ...path, _page.title as string ];
		_page.children.forEach( ( c, i ) => catchWrap(
			() => checkPage( c, thisPath ),
			wrapPageError( thisPath, i ) ) );
	}
};
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
	.add( 'searchBoost', {
		help: 'The score multiplier for pages in search.',
		type: ParameterType.Number,
		defaultValue: 10,
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
		validate: v => {
			if( v ){
				assert( isArray( v ), 'Pages should be an array' );
				v.forEach( ( p, i ) => catchWrap(
					() => checkPage( p, [] ),
					wrapPageError( [], i ) ) );
			}
		},
	}, v => {
		v = v ?? [];
		// TODO: Better checks
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
	} )
	.add( 'logLevel', {
		help: 'The plugin log level.',
		type: ParameterType.Map,
		map: LogLevel,
		defaultValue: plugin.application.logger.level,
	} )
	.build();
