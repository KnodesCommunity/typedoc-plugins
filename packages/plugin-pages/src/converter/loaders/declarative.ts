import assert from 'assert';
import { readFileSync } from 'fs';

import { format } from 'util';

import { difference, isArray, isNil, isString, last } from 'lodash';
import { LiteralUnion } from 'type-fest';

import { IPluginComponent, PluginAccessor, getPlugin } from '@knodes/typedoc-pluginutils';
import { join, relative, resolve } from '@knodes/typedoc-pluginutils/path';

import type { AnyLoaderRawPageNode } from '.';
import type { PagesPlugin } from '../../plugin';
import { trimExt } from '../utils';
import { IBaseRawNode, ICheckConfigContext, INodeLoader, IRegisterNodeContext, NodeGenerator, SourceNode, UnknownNode, nodeHasFile } from './nodes';

interface IIOPath {
	input: string;
}

const pageKeys: Array<keyof DeclarativeNodeLoader.IRawNode> = [ 'children', 'childrenDir', 'source', 'name', 'moduleRoot' ];

// @LEGACY -- Remove @experimental for v0.24
/**
 * @experimental
 */
export class DeclarativeNodeLoader implements IPluginComponent<PagesPlugin>, INodeLoader<DeclarativeNodeLoader.IRawNode, IIOPath> {
	public constructor( private readonly _parent: PluginAccessor<PagesPlugin>, public readonly plugin = getPlugin( _parent ) ) {}

	/**
	 * Check if the node can be loaded by this loader.
	 *
	 * @param rawNode - The node to check.
	 * @returns `true` if this loader can be used to load this node.
	 */
	public canHandle( rawNode: UnknownNode ): boolean {
		if( isNil( rawNode.loader ) ){
			return true;
		}
		return rawNode.loader === 'declarative';
	}

	/**
	 * Asserts that the given node has a valid config for this loader.
	 *
	 * @param rawNode - The node to check.
	 * @param context - The check context. Contains an utility to recurse, and the current path.
	 */
	public checkConfigNode( rawNode: UnknownNode, { recurse }: ICheckConfigContext ): asserts rawNode is DeclarativeNodeLoader.IRawNode {
		if( 'title' in rawNode && !( 'name' in rawNode ) ){
			rawNode.name = rawNode.title;
			delete rawNode.title;
			getPlugin( this._parent ).logger.warn( format( 'Node %O is using deprecated "title" property. Use "name" instead', rawNode ) );
		}
		assert( 'name' in rawNode && isString( rawNode.name ), format( 'Node %O should have a string "name"', rawNode ) );
		const extraProps = difference( Object.keys( rawNode ), pageKeys as string[] );
		assert.equal( extraProps.length, 0, format( 'Node %O has unexpected extra properties %O', rawNode, extraProps ) );
		if( 'children' in rawNode && !isNil( rawNode.children ) ){
			assert( isArray( rawNode.children ), format( 'Node %O should have a `children` array, or be nil', rawNode ) );
			rawNode.children.forEach( ( c, i ) => recurse( c, [ 'children', i ] ) );
		}
	}

	/**
	 * Expand & yield menus & pages from the given node.
	 *
	 * @param rawNode - The node to register.
	 * @param context - The context of the current collection. Contains an utility to recurse, a list of parent nodes, and an arbitrary data store generated by parents.
	 * @yields a list of nodes along with their parents
	 */
	public *collectNodes( rawNode: DeclarativeNodeLoader.IRawNode, { parents: _parents, recurse, data: _data }: IRegisterNodeContext<IIOPath> ): NodeGenerator {
		const resolved = this._resolveRawNode( rawNode, _parents, _data );
		if( !resolved ){
			return;
		}
		const { yieldSelf, data, childrenParents } = resolved;
		if( yieldSelf ){
			yield yieldSelf;
		}
		for( const child of rawNode.children ?? [] ){
			yield* recurse( child, childrenParents, data );
		}
	}

	/**
	 * Resolve informations of a raw declarative node.
	 *
	 * @param rawNode - The node from configuration.
	 * @param parents - A list of nodes yielded as parents of this node.
	 * @param data - The declarative loader context data.
	 * @returns informations about the node and its descendants.
	 */
	private _resolveRawNode( rawNode: DeclarativeNodeLoader.IRawNode, parents: SourceNode[], data?: IIOPath ) {
		if( rawNode.moduleRoot ){
			const module = last( parents ) ?? assert.fail();
			const { output: modOutput, fs: modFs, virtual: modVirtual } = this._getModuleContext( module );
			assert( parents.length === 1, 'Found module root in a child page' );
			if( rawNode.name !== module.name ){
				return undefined;
			}
			const defaultData = {
				input: join( modFs, rawNode.childrenDir ),
				output: modOutput,
			};
			if( rawNode.source ) {
				assert( isNil( module.content ), format( 'Module "%s" already have an appendix, defined in "%s"', module.name, module.path?.fs ) );
				const loaded = this._loadNodeData( rawNode, module, { input: modFs } );
				if( loaded.path ){
					loaded.path.virtual = modVirtual;
				}
				return {
					yieldSelf: {
						node: loaded,
						parents: [],
					},
					data: defaultData,
					childrenParents: parents,
				};
			} else {
				return {
					yieldSelf: {
						node: module,
						parents,
					},
					data: defaultData,
					childrenParents: parents,
				};
			}
		}
		data = data ?? { input: this.plugin.rootDir };
		const childData = {
			input: join( data.input, rawNode.childrenDir ?? ( rawNode.source ? trimExt( rawNode.source ) : null ) ),
		};
		if( rawNode.name === 'VIRTUAL' ){
			return {
				data: childData,
				childrenParents: parents,
			};
		}
		const node = this._loadNodeData( rawNode, last( parents ) ?? assert.fail(), data );
		return {
			yieldSelf: {
				node,
				parents,
			},
			data: childData,
			childrenParents: [ node, ...parents ],
		};
	}

	/**
	 * Resolve the context data for the given module
	 *
	 * @param module - The module source node.
	 * @returns the module path metadata along with the expected output directory for pages of this module.
	 */
	private _getModuleContext( module: SourceNode ){
		assert( nodeHasFile( module ) );
		const { path } = module;
		const output = join( path.virtual === '~' ? null : path.urlFragment ?? assert.fail(), this.plugin.pluginOptions.getValue().output );
		return { ...path, output };
	}

	/**
	 * Load raw node data by reading the filesystem if a source is specified.
	 *
	 * @param rawNode - The node to load.
	 * @param module - The module of the loaded node.
	 * @param io - Input path accumulator.
	 * @returns the loaded source node (page or menu).
	 */
	private _loadNodeData( rawNode: DeclarativeNodeLoader.IRawNode, module: SourceNode, io: IIOPath ): SourceNode {
		if( rawNode.source ){
			assert( nodeHasFile( module ) );
			const filePath = resolve( io.input, rawNode.source );
			return {
				name: rawNode.name,
				content: readFileSync( filePath, 'utf-8' ),
				path: {
					fs: filePath,
					virtual: trimExt( relative( module.path.fs, filePath ) ),
				},
			};
		} else {
			return { name: rawNode.name };
		}
	}
}
export namespace DeclarativeNodeLoader {
	/**
	 * Defines a page or menu entry.
	 * The item is considered as a menu-only if it does not have a {@link source}.
	 */
	export interface IRawNode extends IBaseRawNode {
		loader?: 'declarative';
		moduleRoot?: boolean;
		/**
		 * List of children nodes. Both pages & menu entries can have children.
		 */
		children?: AnyLoaderRawPageNode[];
		/**
		 * The directory in which children are sourced.\
		 *
		 * @see {@page pages-tree.md} for details.
		 */
		childrenDir?: string;
		/**
		 * The source file. The node is a page **only** if this property is set.
		 */
		source?: string;
		/**
		 * The name of the page/menu.
		 *
		 * If setting {@link IRootPageNode.moduleRoot} to `true`, the name is used to lookup the module/package/workspace to attach children to. When a {@link source} is
		 * also provided, the source is prepended to the target module index page.
		 *
		 * If set to `'VIRTUAL'`, the node itself is omitted and children are flattened while cumulating the node's source & output.
		 *
		 * @see {@page pages-tree.md} for details.
		 */
		name: LiteralUnion<'VIRTUAL', string>;
	}
}
