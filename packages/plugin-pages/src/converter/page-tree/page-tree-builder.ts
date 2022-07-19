import assert from 'assert';

import { DeclarationReflection, MinimalSourceFile, ProjectReflection, Reflection, normalizePath } from 'typedoc';

import { IPluginComponent, getWorkspaces, miscUtils, resolveNamedPath } from '@knodes/typedoc-pluginutils';

import { ANodeReflection, MenuReflection, NodeReflection, PageReflection } from '../../models/reflections';
import { IPageNode, IPluginOptions, IRootPageNode } from '../../options';
import type { PagesPlugin } from '../../plugin';
import { getDir, getNodePath, getNodeUrl, join } from './utils';

const isModuleRoot = ( pageNode: IPageNode | IRootPageNode ) => 'moduleRoot' in pageNode && !!pageNode.moduleRoot;

type PageNode = IPageNode | IRootPageNode;

interface IIOPath {
	inputContainer?: string;
	input?: string;
	output?: string;
}
export class PageTreeBuilder implements IPluginComponent<PagesPlugin> {
	private readonly _logger = this.plugin.logger.makeChildLogger( PageTreeBuilder.name );
	public constructor( public readonly plugin: PagesPlugin ){}

	/**
	 * Convert pages specified in the plugin options to reflections.
	 *
	 * @param project - The project reflection.
	 * @param options - The plugin options.
	 * @returns the nodes tree.
	 */
	public buildPagesTree( project: ProjectReflection, options: IPluginOptions ): MenuReflection {
		const rootMenu = new MenuReflection( 'ROOT', project, undefined, '' );
		if( !options.pages || options.pages.length === 0 ){
			return rootMenu;
		} else {
			if( options.pages.some( p => p.moduleRoot ) ){
				rootMenu.childrenNodes = this._mapNodesToReflectionsTree(
					options.pages,
					project,
					{ inputContainer: options.source, output: options.output } );
			} else {
				const projectRoot = new MenuReflection( project.name, project, project, project.url ?? '' );
				projectRoot.childrenNodes = this._mapNodesToReflectionsTree(
					options.pages,
					projectRoot,
					{ inputContainer: options.source, output: options.output } );
				rootMenu.childrenNodes = projectRoot.childrenNodes.length > 0 ? [ projectRoot ] : [];
			}
			return rootMenu;
		}
	}

	/**
	 * Get the module with the given {@link name}.
	 *
	 * @param reflection - The reflection to get the project from.
	 * @param name - The name of the module to search.
	 * @returns the module declaration reflection, or `undefined`.
	 */
	private _getModule( reflection: Reflection, name: string ): ANodeReflection.Module {
		if( name === reflection.project.name ){
			return reflection.project;
		}
		const modules = getWorkspaces( reflection.project ).slice( 1 );
		const modulesWithName = modules.filter( m => m.name === name );
		assert( modulesWithName.length === 1 );
		return modulesWithName[0] as DeclarationReflection;
	}

	/**
	 * Map multiple raw page node objects to node reflections.
	 *
	 * @param nodes - The nodes.
	 * @param parent - The parent of this node (project, module or node).
	 * @param io - The children base input/output paths
	 * @returns the node reflections.
	 */
	private _mapNodesToReflectionsTree( nodes: PageNode[], parent: ANodeReflection.Parent, io: IIOPath ): NodeReflection[] {
		return nodes
			.map( n => this._mapNodeToReflection( n, parent, io ) )
			.flat( 1 );
	}

	/**
	 * Map a single raw page node object to node reflections.
	 *
	 * @param node - The node.
	 * @param parent - The parent of this node (project, module or node).
	 * @param io - The children base input/output paths
	 * @returns the node reflections.
	 */
	private _mapNodeToReflection( node: PageNode, parent: ANodeReflection.Parent, io: IIOPath ): NodeReflection[] {
		const childrenIO: IIOPath = isModuleRoot( node ) ? { ...io } : {
			...io,
			input: join( io.input, getDir( node, 'source' ) ),
			output: join( io.output, getDir( node, 'output' ) ),
		};
		if( node.title === 'VIRTUAL' ){
			return node.children ?
				this._mapNodesToReflectionsTree( node.children, parent, childrenIO ) :
				[];
		}
		const nodeReflection = this._getNodeReflection( node, parent, io );
		if( !( nodeReflection.module instanceof ProjectReflection ) && nodeReflection.isModuleAppendix ){
			// If the node is attached to a new module, skip changes in the input tree (stay at root of `pages` in module)
			childrenIO.input = io.input;
			// Output is now like `pkg-a/pages/...`
			childrenIO.output = `${nodeReflection.name.replace( /[^a-z0-9]/gi, '_' )}/${io.output ?? ''}`;
		}
		const children = node.children ?
			this._mapNodesToReflectionsTree(
				node.children,
				nodeReflection,
				childrenIO ) :
			[];
		// Strip empty menu items
		if( nodeReflection instanceof MenuReflection && children.length === 0 ){
			this._logger.warn( `Stripping menu item ${getNodePath( node, parent )} because it has no children.` );
			return [];
		}
		nodeReflection.childrenNodes = children;
		return [ nodeReflection ];
	}

	/**
	 * Infer the parent & module for the given node.
	 *
	 * @param node - The node to get parent & modules for.
	 * @param parent - The default parent.
	 * @returns an object containing the final module & parent for the node.
	 */
	private _getNodeParent( node: PageNode, parent: ANodeReflection.Parent ){
		const module: ANodeReflection.Module = isModuleRoot( node ) ?
			miscUtils.catchWrap(
				() => this._getModule( parent, node.title ),
				`Invalid pages configuration: could not find a workspace named "${node.title}"`,
			) :
			parent instanceof ANodeReflection ? parent.module : parent.project;
		return { module, parent: parent instanceof ANodeReflection ? parent : module };
	}

	/**
	 * Generate a node reflection.
	 *
	 * @param node - The node.
	 * @param parent - The parent of this node (project, module or node).
	 * @param io - This node input/output paths.
	 * @returns the node reflection.
	 */
	private _getNodeReflection( node: PageNode, parent: ANodeReflection.Parent, io: IIOPath ){
		const { module, parent: actualParent } = this._getNodeParent( node, parent );
		if( node.source ){
			const nodePath = join( io.input, node.source );
			const sourceFilePath = miscUtils.catchWrap(
				() => resolveNamedPath( module, io.inputContainer, nodePath ),
				err => new Error( `Could not locate page for ${getNodePath( node, actualParent )}`, { cause: err } ) );
			const page = miscUtils.catchWrap(
				() => new PageReflection(
					node.title,
					module,
					actualParent,
					sourceFilePath,
					nodePath,
					normalizePath( join( io.output, getNodeUrl( node ) ) ) ),
				`Could not generate a page reflection for ${getNodePath( node, actualParent )}` );
			page.comment = this.plugin.application.converter.parseRawComment( new MinimalSourceFile( page.content, page.sourceFilePath ) );
			return page;
		}
		return new MenuReflection(
			node.title,
			module,
			actualParent,
			normalizePath( join( io.output, getNodeUrl( { output: 'index.html', ...node } ) ) ) );
	}
}
