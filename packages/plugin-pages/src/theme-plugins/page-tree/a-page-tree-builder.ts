import assert from 'assert';

import { DeclarationReflection, ProjectReflection, Reflection, ReflectionKind, RenderTemplate, RendererEvent, Theme, UrlMapping, normalizePath } from 'typedoc';

import { PathReflectionResolver, catchWrap } from '@knodes/typedoc-pluginutils';

import { IPageNode, IPluginOptions, IRootPageNode } from '../../options';
import type { PagesPlugin } from '../../plugin';
import { MenuReflection, NodeReflection, PageReflection, PagesPluginReflectionKind } from '../../reflections';
import { ANodeReflection } from '../../reflections/a-node-reflection';
import { RenderPageLinkProps } from '../../theme';
import { IPageTreeBuilder } from './types';
import { getDir, getNodePath, getNodeUrl, join } from './utils';

const isModuleRoot = ( pageNode: IPageNode | IRootPageNode ) => 'moduleRoot' in pageNode && !!pageNode.moduleRoot;

type PageNode = IPageNode | IRootPageNode;

interface IIOPath {
	input?: string;
	output?: string;
}
export abstract class APageTreeBuilder implements IPageTreeBuilder {
	public abstract renderPageLink: RenderTemplate<RenderPageLinkProps>;
	private readonly _pathReflectionResolver = new PathReflectionResolver( this.plugin );

	public constructor( protected readonly theme: Theme, public readonly plugin: PagesPlugin ){}
	/**
	 * Generate mappings (pages) from the given node reflections.
	 *
	 * @param event - The render event to affect.
	 * @param reflections - The list of node reflections (pages & menu).
	 * @returns the list of mappings to create.
	 */
	public abstract generateMappings( event: RendererEvent, reflections: NodeReflection[] ): Array<UrlMapping<PageReflection>>;
	/**
	 * Register the {@link nodeReflection} into the correct reflection (project or module).
	 *
	 * @param nodeReflection - The node reflection.
	 */
	protected abstract addNodeToProjectAsChild( nodeReflection: NodeReflection ): void;

	/**
	 * Convert pages specified in the plugin options to reflections.
	 *
	 * @param project - The project reflection.
	 * @param options - The plugin options.
	 * @returns the nodes tree.
	 */
	public buildPagesTree( project: ProjectReflection, options: IPluginOptions ): NodeReflection[] {
		if( !options.pages || options.pages.length === 0 ){
			return [];
		} else {
			return this._mapPagesToReflectionsTree(
				options.pages,
				project,
				{ input: options.source, output: options.output } );
		}
	}

	/**
	 * Map the {@link kind} to a {@link ReflectionKind}. Note that the returned kind may be a custom one defined by the plugin (like {@link PagesPluginReflectionKind.PAGE}
	 * or {@link PagesPluginReflectionKind.MENU}).
	 * This method might be used to emulate pages as being namespaces, allowing compatibility with the default theme.
	 *
	 * @param kind - The kind to map.
	 * @returns the actual reflection kind.
	 */
	protected getReflectionKind( kind: PagesPluginReflectionKind ): ReflectionKind {
		return kind as any;
	}

	/**
	 * Get the module with the given {@link name}.
	 *
	 * @param reflection - The reflection to get the project from.
	 * @param name - The name of the module to search.
	 * @returns the module declaration reflection, or `undefined`.
	 */
	private _getModule( reflection: Reflection, name: string ){
		if( name === reflection.project.name ){
			return reflection.project;
		}
		const modules = this._pathReflectionResolver.getWorkspaces( reflection.project ).slice( 1 );
		const modulesWithName = modules.filter( m => m.name === name );
		assert( modulesWithName.length <= 1 );
		return modulesWithName[0] as DeclarationReflection | undefined;
	}

	/**
	 * Map multiple raw page node objects to node reflections.
	 *
	 * @param nodes - The nodes.
	 * @param parent - The parent of this node (project, module or node).
	 * @param io - The children base input/output paths
	 * @returns the node reflections.
	 */
	private _mapPagesToReflectionsTree( nodes: PageNode[], parent: ProjectReflection | DeclarationReflection, io: IIOPath ): NodeReflection[] {
		return nodes
			.map( n => this._mapPageToReflection( n, parent, io ) )
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
	private _mapPageToReflection( node: PageNode, parent: ProjectReflection | DeclarationReflection, io: IIOPath ): NodeReflection[] {
		const childrenIO: IIOPath = isModuleRoot( node ) ? { ...io } : {
			...io,
			input: join( io.input, getDir( node, 'source' ) ),
			output: join( io.output, getDir( node, 'output' ) ),
		};
		if( node.title === 'VIRTUAL' ){
			return node.children ?
				this._mapPagesToReflectionsTree( node.children, parent, childrenIO ) :
				[];
		}
		// Strip empty menu items
		if( !node.source && ( !node.children || node.children.length === 0 ) ){
			this.plugin.logger.warn( `Stripping menu item ${getNodePath( node, parent )} because it has no children.` );
			return [];
		}
		const nodeReflection = this._getNodeReflection( node, parent, io );
		if( !( nodeReflection.module instanceof ProjectReflection ) && nodeReflection.isModuleAppendix ){
			// If the node is attached to a new module, skip changes in the input tree (stay at root of `pages` in module)
			childrenIO.input = io.input;
			// Output is now like `pkg-a/pages/...`
			childrenIO.output = `${nodeReflection.name.replace( /[^a-z0-9]/gi, '_' )}/${io.output ?? ''}`;
		}
		this.addNodeToProjectAsChild( nodeReflection );
		const children = node.children ?
			this._mapPagesToReflectionsTree(
				node.children,
				nodeReflection,
				childrenIO ) :
			[];
		nodeReflection.children = children;
		return [ nodeReflection ];
	}

	/**
	 * Infer the parent & module for the given node.
	 *
	 * @param node - The node to get parent & modules for.
	 * @param parent - The default parent.
	 * @returns an object containing the final module & parent for the node.
	 */
	private _getNodeParent( node: PageNode, parent: ProjectReflection | DeclarationReflection ){
		const module: ProjectReflection | DeclarationReflection = isModuleRoot( node ) ?
			catchWrap(
				() => {
					const _module = this._getModule( parent, node.title );
					assert( _module );
					return _module;
				},
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
	private _getNodeReflection( node: PageNode, parent: ProjectReflection | DeclarationReflection, io: IIOPath ){
		const { module, parent: actualParent } = this._getNodeParent( node, parent );
		if( node.source ){
			const filename = this._pathReflectionResolver.resolveNamedPath( actualParent.project, join( io.input, node.source ), { currentReflection: module } );
			// TODO: throw depending on configuration
			if( !filename ){
				throw new Error( `Could not locate page for ${getNodePath( node, actualParent )}` );
			}
			return catchWrap(
				() => new PageReflection(
					node.title,
					this.getReflectionKind( PagesPluginReflectionKind.PAGE ),
					module,
					actualParent,
					filename,
					normalizePath( join( io.output, getNodeUrl( node ) ) ) ),
				`Could not generate a page reflection for ${getNodePath( node, actualParent )}` );
		}
		return new MenuReflection(
			node.title,
			this.getReflectionKind( PagesPluginReflectionKind.MENU ),
			module,
			actualParent );
	}
}
