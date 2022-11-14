import assert from 'assert';
import { format } from 'util';

import { isNil } from 'lodash';

import { IPluginComponent, PluginAccessor, getPlugin } from '@knodes/typedoc-pluginutils';

import type { PagesPlugin } from '../../plugin';
import { DeclarativeNodeLoader } from './declarative';
import { FrontMatterNodeLoader } from './front-matter';
import { IBaseRawNode, ICheckConfigContext, INodeLoader, IRegisterNodeContext, ModuleSourceNode, NodeGenerator, SourceNode } from './nodes';
import { TemplateNodeLoader } from './template';

export class RootNodeLoader implements IPluginComponent<PagesPlugin>, INodeLoader<IBaseRawNode, any> {
	private readonly _registeredNodes = new Map<IBaseRawNode, boolean>();
	private readonly _loaders: Array<INodeLoader<IBaseRawNode, any>> = [
		new FrontMatterNodeLoader( this ),
		new TemplateNodeLoader( this ),
		new DeclarativeNodeLoader( this ),
	];
	private readonly _logger = this.plugin.logger.makeChildLogger( this.constructor.name );
	public get unregisteredNodes() {
		return [ ...this._registeredNodes.entries() ].filter( ( [ , registered ] ) => !registered ).map( ( [ node ] ) => node );
	}
	private readonly _loaderData = new WeakMap<INodeLoader<any>, WeakMap<SourceNode, any>>();
	public constructor( private readonly _parent: PluginAccessor<PagesPlugin>, public readonly plugin: PagesPlugin = getPlugin( _parent ) ) {}

	/**
	 * Check if the node can be loaded by this loader.
	 *
	 * @param node - The node to check.
	 * @returns `true` if this loader can be used to load this node.
	 */
	public canHandle( node: IBaseRawNode ): boolean {
		return !isNil( this._getLoaderForNode( node ) );
	}

	/**
	 * Asserts that the given node has a valid config for this loader.
	 *
	 * @param node - The node to check.
	 * @param context - The check context. Contains an utility to recurse, and the current path.
	 */
	public checkConfigNode( node: IBaseRawNode, context: ICheckConfigContext ): asserts node is IBaseRawNode {
		const loader: INodeLoader<IBaseRawNode> = this._getLoaderForNode( node );
		loader.checkConfigNode( node, context );
	}

	/**
	 *
	 * @param rawNode
	 * @param rootNodes
	 */
	public *collectRootNodes( rawNode: IBaseRawNode, rootNodes: ModuleSourceNode[] ) {
		for( const rootNode of rootNodes ){
			yield* this.collectNodes( rawNode, {
				parents: [ rootNode ],
			} );
		}
	}

	/**
	 *
	 * @param rawNode
	 * @param context
	 */
	public *collectNodes( rawNode: IBaseRawNode, context: Omit<IRegisterNodeContext<void>, 'recurse'> ): NodeGenerator {
		const loader = this._getLoaderForNode( rawNode );
		this._logger.verbose( format( 'Loading node %O with loader %s', rawNode, loader.constructor.name ) );
		const dataStore = this._loaderData.get( loader ) ?? new WeakMap();
		this._loaderData.set( loader, dataStore );

		const closestParentWithData = context.parents.find( p => dataStore.has( p ) );
		try {
			const nodes = [ ...loader.collectNodes( rawNode, {
				...context,
				data: closestParentWithData ? dataStore.get( closestParentWithData ) : undefined,
				recurse: ( node, parents, data ) => {
					dataStore.set( parents[0], data );
					return this.collectNodes( node, { parents } );
				},
			} ) ];
			const wasRegistered = this._registeredNodes.get( rawNode ) ?? false;
			this._registeredNodes.set( rawNode, nodes.length > 0 || wasRegistered );
			yield* nodes;
		} catch( e: any ){
			this._logger.error( `An error occured while collecting nodes: ${e}` );
			throw new Error( format( 'Error during node collection from %O', rawNode ), { cause: e } );
		}
	}

	/**
	 * Get a single loader responsible for loading this node.
	 *
	 * @param node - The node to load.
	 * @returns the loader for the node.
	 */
	private _getLoaderForNode( node: IBaseRawNode ): INodeLoader<IBaseRawNode>{
		const validLoaders = this._loaders.filter( l => l.canHandle( node ) );
		assert( validLoaders.length === 1, format( '%O loader(s) can be used to load node %O', validLoaders.length, node ) );
		return validLoaders[0];
	}
}
export { IBaseRawNode, NodePath, INodeInParent, SourceNode, ModuleSourceNode } from './nodes';
export type AnyLoaderRawPageNode = FrontMatterNodeLoader.IRawNode | TemplateNodeLoader.IRawNode | DeclarativeNodeLoader.IRawNode;
