import assert, { AssertionError } from 'assert';

import { difference, groupBy, isArray, isNil, isObject, isString, uniq } from 'lodash';
import { LogLevel, ParameterType } from 'typedoc';

import { OptionGroup, miscUtils } from '@knodes/typedoc-pluginutils';

import type { PagesPlugin } from '../plugin';
import { EInvalidPageLinkHandling, IPageNode, IPluginOptions, IRootPageNode } from './types';

const wrapPageError = ( path: string[], index: number ) => ( err: any ) => {
	if( err instanceof AssertionError ){
		const pathStr = path.length > 0 ? ` in ${path.map( p => JSON.stringify( p ) ).join( ' ⇒ ' )}` : '';
		return new Error( `Invalid page${pathStr} @ index ${index}: ${err.message ?? err}`, { cause: err } );
	} else {
		return err;
	}
};
const pageKeys: Array<keyof IPageNode> = [ 'children', 'childrenDir', 'childrenOutputDir', 'childrenSourceDir', 'output', 'source', 'title' ];
const checkPageFactory = <T extends IPageNode>( allowedKeys: Array<keyof T> ) => ( page: unknown, path: string[] ): asserts page is T => {
	assert( page && isObject( page ), 'Page should be an object' );
	const _page = page as Record<string, unknown>;
	assert( 'title' in _page && isString( _page.title ), 'Page should have a title' );
	const extraProps = difference( Object.keys( _page ), allowedKeys as string[] );
	assert.equal( extraProps.length, 0, `Page ${[ ...path, _page.title ].map( p => `"${p}"` ).join( ' ⇒ ' )} have extra properties ${JSON.stringify( extraProps )}` );
	if( 'children' in _page && !isNil( _page.children ) ){
		assert( isArray( _page.children ), 'Page children should be an array' );
		const thisPath = [ ...path, _page.title as string ];
		_page.children.forEach( ( c, i ) => miscUtils.catchWrap(
			() => checkPage( c, thisPath ),
			wrapPageError( thisPath, i ) ) );
	}
};
const checkPage = checkPageFactory<IPageNode>( pageKeys );
const checkRootPage = checkPageFactory<IRootPageNode>( [ ...pageKeys, 'moduleRoot' ] );
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
		validate: v => {
			if( v ){
				assert( isArray( v ), 'Pages should be an array' );
				v.forEach( ( p, i ): asserts p is IRootPageNode => miscUtils.catchWrap(
					() => checkRootPage( p, [] ),
					wrapPageError( [], i ) ) );
				const rootFlags = groupBy( v, p => !!p.moduleRoot );
				assert.equal( Object.keys( rootFlags ).length, 1, 'Every root pages should set `moduleRoot` to true, or none' );
				if( rootFlags.true ) {
					assert.equal( uniq( v.map( p => p.title ) ).length, v.length, 'Every root pages should have a different title' );
				}
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
	.add( 'excludeMarkdownTags', {
		help: 'A list of markdown captures to omit. Includes the tag name, but without the leading `@`.',
		type: ParameterType.Array,
		validate: patterns => patterns?.forEach( p => assert( !p.startsWith( '@' ), `Pattern ${JSON.stringify( p )} should not start with a leading '@'` ) ),
	}, v => v ?? [] )
	.build();
