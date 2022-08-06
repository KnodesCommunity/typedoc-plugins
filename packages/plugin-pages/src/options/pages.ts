import assert, { AssertionError } from 'assert';

import { difference, groupBy, isArray, isFunction, isNil, isObject, isString } from 'lodash';

import { miscUtils } from '@knodes/typedoc-pluginutils';

import type { PagesPlugin } from '../plugin';
import { IOptionTemplatePage, IPageNode, IRootPageNode } from './types';

const wrapPageError = ( path: string[], index: number ) => ( err: any ) => {
	if( err instanceof AssertionError ){
		const pathStr = path.length > 0 ? ` in ${path.map( p => JSON.stringify( p ) ).join( ' ⇒ ' )}` : '';
		return new Error( `Invalid page${pathStr} @ index ${index}: ${err.message ?? err}`, { cause: err } );
	} else {
		return err;
	}
};

interface IPageValidationContext<T extends IPageNode> {
	allowedKeys: Array<keyof T>;
	plugin: PagesPlugin;
	path: string[];
	pagePath: () => string;
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions -- type assertion quirk
function assertIsIOptionTemplatePage<T extends IPageNode>( page: any, { allowedKeys, plugin, path }: IPageValidationContext<T> ): asserts page is IOptionTemplatePage<T> {
	assert( isString( page.match ) );
	assert( isArray( page.template ) || isFunction( page.template ) );
	if( isArray( page.template ) ) {
		const selfFn = checkPageFactory( allowedKeys );
		( page.template as any[] ).forEach( ( t, i ) => selfFn( plugin, t, [ ...path, `TEMPLATE ${i + 1}` ] ) );
	}
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions -- type assertion quirk
function assertIsIPageNode<T extends IPageNode>( page: any, { allowedKeys, plugin, path, pagePath }: IPageValidationContext<T> ): asserts page is T {
	if( 'title' in page && !( 'name' in page ) ){
		page.name = page.title;
		delete page.title;
		plugin.logger.warn( `Page ${pagePath()} is using deprecated "title" property. Use "name" instead.` );
	}
	assert( 'name' in page && isString( page.name ), `Page ${pagePath()} should have a name` );
	const extraProps = difference( Object.keys( page ), allowedKeys as string[] );
	assert.equal( extraProps.length, 0, `Page ${pagePath()} have extra properties ${JSON.stringify( extraProps )}` );
	if( 'children' in page && !isNil( page.children ) ){
		assert( isArray( page.children ), `Page ${pagePath()} "children" should be an array` );
		const thisPath = [ ...path, page.name as string ];
		( page.children as any[] ).forEach( ( c, i ) => miscUtils.catchWrap(
			() => checkPage( plugin, c, thisPath ),
			wrapPageError( thisPath, i ) ) );
	}
}

const pageKeys: Array<keyof IPageNode> = [ 'children', 'childrenDir', 'childrenOutputDir', 'childrenSourceDir', 'output', 'source', 'name' ];
const checkPageFactory = <T extends IPageNode>( allowedKeys: Array<keyof T> ) => ( plugin: PagesPlugin, page: unknown, path: string[] ): asserts page is T => {
	assert( page && isObject( page ), 'Page should be an object' );
	const _page = page as Record<string, unknown>;
	const pagePath = () => [ ...path, _page.name ].map( p => `"${p ?? 'Unnamed'}"` ).join( ' ⇒ ' );
	const valContext: IPageValidationContext<T> = {
		allowedKeys,
		plugin,
		pagePath,
		path,
	};
	if( 'match' in page && 'template' in page ){
		assertIsIOptionTemplatePage<T>( page, valContext );
	} else if( !( 'match' in page ) && !( 'template' in page ) ){
		assertIsIPageNode<T>( page, valContext );
	} else {
		throw new Error( `Page ${pagePath()} has a "match" or "template" property, but it should have both or none` );
	}
};
const checkPage = checkPageFactory<IPageNode>( pageKeys );
const checkRootPage = checkPageFactory<IRootPageNode>( [ ...pageKeys, 'moduleRoot' ] );

export const validatePages = ( plugin: PagesPlugin ) => ( v: unknown ) => {
	if( v ){
		assert( isArray( v ), 'Pages should be an array' );
		v.forEach( ( p, i ): asserts p is IRootPageNode => miscUtils.catchWrap(
			() => checkRootPage( plugin, p, [] ),
			wrapPageError( [], i ) ) );
		const flattenRootNodes = ( vv: any ) => 'template' in vv ?
			isArray( vv.template ) ? vv.template.flatMap( ( vvv: any ) => flattenRootNodes( vvv ) ) : [] :
			[ vv ];
		const rootFlags = groupBy( v.flatMap( vv => flattenRootNodes( vv ) ), p => !!p.moduleRoot );
		assert( Object.keys( rootFlags ).length <= 1, 'Every root pages should set `moduleRoot` to true, or none' );
	}
};
