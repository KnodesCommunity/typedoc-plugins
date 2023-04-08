import assert from 'assert';
import { format } from 'util';

import { pick } from 'lodash';
import minimatch from 'minimatch';
import { DeclarationReflection, MinimalSourceFile, ProjectReflection, ReflectionKind } from 'typedoc';

import { IPluginComponent, miscUtils } from '@knodes/typedoc-pluginutils';
import { join, normalize, resolve } from '@knodes/typedoc-pluginutils/path';

import { NodesTreeBuild, buildNodesTree, getNodePath } from './utils';
import { ANodeReflection, MenuReflection, NodeReflection, PageReflection } from '../../models/reflections';
import type { PagesPlugin } from '../../plugin';
import { ModuleSourceNode, RootNodeLoader, SourceNode } from '../loaders';
import { urlize } from '../utils';

const nodeReflectionToJson = ( node: ANodeReflection ): any => ( {
	...pick( node, 'id', 'name', 'originalName' ),
	fullName: node.getFullName(),
	friendlyFullName: node.getFriendlyFullName(),
	...pick( node, 'url', 'comment', 'sources', 'pageVirtualPath', 'namedPath' ),
	childrenNodes: node.childrenNodes?.map( nodeReflectionToJson ),
} );

interface IReflectionBuildContext {
	url: string;
}

/**
 * Class responsible of converting configuration to Typedoc models ({@link import('typedoc').Reflection}).
 *
 * For this, options are first normalized & merged in nodes, then those nodes are converted to {@link PageReflection} or {@link MenuReflection}.
 */
export class PageTreeBuilder implements IPluginComponent<PagesPlugin> {
	private readonly _logger = this.plugin.logger.makeChildLogger( PageTreeBuilder.name );
	public constructor( public readonly plugin: PagesPlugin, private readonly _nodeLoader: RootNodeLoader ){}

	/**
	 * Convert pages specified in the plugin options to reflections.
	 *
	 * @param project - The project reflection.
	 * @returns the nodes tree.
	 */
	public buildPagesTree( project: ProjectReflection ): MenuReflection {
		const options = this.plugin.pluginOptions.getValue();
		const rootMenu = new MenuReflection( 'ROOT', project, undefined );

		const modulesWithEntrypoint = project.getChildrenByKind( ReflectionKind.Module )
			.reduce<Array<{entrypoint: string; mod: DeclarationReflection}>>( ( acc, mod ) => {
				const src = mod.sources?.[0].fullFileName;
				assert( src );
				// Sort entrypoints by deepest to higest
				const entryPoints = this.plugin.application.options.getValue( 'entryPoints' ).map( normalize ).sort( ( a, b ) => b.split( '/' ).length - a.split( '/' ).length );
				const entryPoint = entryPoints.find( ep => minimatch( src, `${ep}/**` ) );
				assert(
					entryPoint,
					format(
						'Could not determine the entrypoint of module %s (with source %s). Entrypoints are %j',
						mod.name,
						src,
						entryPoints ) );
				let entryPointRoot = src;
				while( !minimatch( entryPointRoot, entryPoint ) ) {
					const parentDir = resolve( entryPointRoot, '..' );
					assert( parentDir !== entryPointRoot ); // Ensure we are not stuck at the root
					entryPointRoot = parentDir;
				}
				acc.push( { entrypoint: entryPointRoot, mod } );
				return acc;
			}, [] );
		const rootNodes: ModuleSourceNode[] = [
			{
				path: { fs: this.plugin.rootDir, urlFragment: '', virtual: '~' },
				name: project.name,
			},
			...modulesWithEntrypoint.map( ( { entrypoint, mod } ) => ( {
				path: { fs: entrypoint, virtual: mod.name ?? assert.fail(), urlFragment: mod.name.replace( /[^a-z0-9]/gi, '_' ) },
				name: mod.name,
			} ) ),
		];

		if( options.pages?.length > 0 ) {
			const allNodes = [
				...rootNodes.map( node => ( { node, parents: [] } ) ),
				...options.pages
					.map( p => Array.from( this._nodeLoader.collectRootNodes( p, rootNodes ) ) )
					.flat( 1 ),
			];
			miscUtils.writeDiag( options.diagnostics, 'raw-loaded-nodes.json', () => JSON.stringify( allNodes, null, 4 ) );
			const { unregisteredNodes } = this._nodeLoader;
			if( unregisteredNodes.length > 0 ){
				this._logger.warn( format( 'Some pages were present in config, but did not matched anything. Please review the configuration for %O', unregisteredNodes ) );
			}
			const tree = buildNodesTree( allNodes );
			miscUtils.writeDiag( options.diagnostics, 'merged-loaded-nodes.json', () => JSON.stringify( tree, null, 4 ) );
			rootMenu.childrenNodes = tree
				.map( treeNode => {
					assert( treeNode.defs[0].path );
					const treeNodePath = treeNode.defs[0].path;
					const module = treeNodePath.virtual === '~' ? project : modulesWithEntrypoint.find( mwe => mwe.mod.name === treeNodePath.virtual )?.mod ?? assert.fail();
					return this._mapNodeToReflection( treeNode, module, module, { url: join( options.output, treeNodePath.urlFragment ?? assert.fail() ) } );
				} )
				.flat( 1 );
			miscUtils.writeDiag( options.diagnostics, 'final-nodes.json', () => JSON.stringify( nodeReflectionToJson( rootMenu ), null, 4 ) );
		}
		return rootMenu;
	}

	/**
	 * Map multiple raw page node objects to node reflections.
	 *
	 * @param nodes - The nodes.
	 * @param parent - The parent of this node (project, module or node).
	 * @param module - The module of this node.
	 * @param context - The current context to build pages from.
	 * @returns the node reflections.
	 */
	private _mapNodesToReflectionsTree( nodes: NodesTreeBuild[], parent: ANodeReflection.Parent, module: ANodeReflection.Module, context: IReflectionBuildContext ): NodeReflection[] {
		return nodes
			.map( n => this._mapNodeToReflection( n, parent, module, { ...context } ) )
			.flat( 1 );
	}

	/**
	 * Map a single raw page node object to node reflections.
	 *
	 * @param node - The node.
	 * @param parent - The parent of this node (project, module or node).
	 * @param module - The module of this node.
	 * @param context - The current context to build pages from.
	 * @returns the node reflections.
	 */
	private _mapNodeToReflection( node: NodesTreeBuild, parent: ANodeReflection.Parent, module: ANodeReflection.Module, { url }: IReflectionBuildContext ): NodeReflection[] {
		if( parent instanceof ANodeReflection ){
			const nodeUrl = node.defs.find( d => d.path?.urlFragment )?.path?.urlFragment;
			if( nodeUrl?.startsWith( '/' ) ){
				url = nodeUrl;
			} else {
				url = join( url, nodeUrl ?? urlize( node.defs[0].name ) );
			}
		}
		const nodeReflection = this._getNodeReflection( node, parent, module, node.children?.length ?? 0 > 0 ? `${url}/index.html` : `${url}.html` );
		const children = node.children ?
			this._mapNodesToReflectionsTree( node.children, nodeReflection, module, { url } ) :
			[];
		// Strip empty menu items
		if( nodeReflection instanceof MenuReflection && children.length === 0 ){
			if( !( parent instanceof DeclarationReflection || parent instanceof ProjectReflection ) ){
				this._logger.warn( `Stripping menu item ${getNodePath( node, parent )} because it has no children.` );
			}
			return [];
		}
		nodeReflection.childrenNodes = children;
		return [ nodeReflection ];
	}

	/**
	 * Generate a node reflection.
	 *
	 * @param node - The node.
	 * @param parent - The parent of this node (project, module or node).
	 * @param module - The module of this node.
	 * @param url - The desired URL of the page.
	 * @returns the node reflection.
	 */
	private _getNodeReflection( node: NodesTreeBuild, parent: ANodeReflection.Parent, module: ANodeReflection.Module, url: string ){
		const withContent = node.defs.filter( ( d ): d is SourceNode & {content: string} => !!d.content );
		if( withContent.length > 0 ){
			const def = withContent[0];
			if( withContent.length > 1 ) {
				this._logger.warn( format( 'Multiple contents for node "%s", having sources %O. Only the 1st one will be used.', def.name, withContent.map( wc => wc.path?.fs ) ) );
			}
			const page = new PageReflection(
				def.name,
				module,
				parent,
				def.content,
				def.path.fs,
				def.path.virtual,
				url );
			page.comment = this.plugin.application.converter.parseRawComment( new MinimalSourceFile( page.content, page.sourceFilePath ) );
			return page;
		}
		return new MenuReflection(
			node.defs[0].name,
			module,
			parent );
	}
}
