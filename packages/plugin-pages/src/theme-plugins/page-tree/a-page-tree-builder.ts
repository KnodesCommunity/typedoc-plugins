import assert from 'assert';

import { DeclarationReflection, ProjectReflection, Reflection, ReflectionKind, RenderTemplate, RendererEvent, Theme, UrlMapping } from 'typedoc';

import { PathReflectionResolver, catchWrap } from '@knodes/typedoc-pluginutils';

import { IPageNode, IPluginOptions } from '../../options';
import type { PagesPlugin } from '../../plugin';
import { MenuReflection, NodeReflection, PageReflection, PagesPluginReflectionKind } from '../../reflections';
import { ANodeReflection } from '../../reflections/a-node-reflection';
import { RenderPageLinkProps } from '../../theme';
import { IPageTreeBuilder } from './types';
import { getDir, getNodePath, getNodeUrl, join } from './utils';

interface IIOPath {
	input?: string;
	output?: string;
}
export abstract class APageTreeBuilder implements IPageTreeBuilder {
	public abstract renderPageLink: RenderTemplate<RenderPageLinkProps>;
	private readonly _pathReflectionResolver = new PathReflectionResolver( this.plugin );
	private _mappings?: Array<UrlMapping<PageReflection>>;
	public get mappings(): Array<UrlMapping<PageReflection>> {
		assert( this._mappings );
		return this._mappings;
	}
	private _project?: ProjectReflection;
	protected get project(): ProjectReflection {
		assert( this._project );
		return this._project;
	}

	public constructor( protected readonly theme: Theme, public readonly plugin: PagesPlugin ){}
	/**
	 * Generate mappings (pages) from the given node reflections.
	 *
	 * @param event - The render event to affect.
	 * @param reflections - The list of node reflections (pages & menu).
	 * @returns the list of mappings to create.
	 */
	protected abstract generateMappings( event: RendererEvent, reflections: NodeReflection[] ): Array<UrlMapping<PageReflection>>;
	/**
	 * Register the {@link nodeReflection} into the correct reflection (project or module).
	 *
	 * @param nodeReflection - The node reflection.
	 */
	protected abstract addNodeToProjectAsChild( nodeReflection: NodeReflection ): void;

	/**
	 * Alter the {@link event} to add pages & entries for the pages passed via {@link options}.
	 *
	 * @param event - The render event to affect.
	 * @param options - The plugin options.
	 */
	public appendToProject( event: RendererEvent, options: IPluginOptions ): void {
		if( this._mappings ){
			this.plugin.logger.warn( 'Generating mappings multiple times. This is probably a bug, and may result in duplicate pages.' );
		}
		this._project = event.project;
		if( !options.pages || options.pages.length === 0 ){
			this._mappings = [];
		} else {
			const reflections = this._mapPagesToReflections(
				options.pages,
				this.project,
				{ input: options.source, output: options.output } );
			this._mappings = this.generateMappings( event, reflections );
		}
		if( !event.urls ){
			event.urls = [];
		}
		event.urls.push( ...this._mappings );
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
	private _mapPagesToReflections( nodes: IPageNode[], parent: ProjectReflection | DeclarationReflection, io: IIOPath ): NodeReflection[] {
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
	private _mapPageToReflection( node: IPageNode, parent: ProjectReflection | DeclarationReflection, io: IIOPath ): NodeReflection[] {
		const childrenIO: IIOPath = {
			...io,
			input: join( io.input, getDir( node, 'source' ) ),
			output: join( io.output, getDir( node, 'output' ) ),
		};
		if( node.title === 'VIRTUAL' ){
			return node.children ?
				this._mapPagesToReflections( node.children, parent, childrenIO ) :
				[];
		}
		// Strip empty menu items
		if( !node.source && ( !node.children || node.children.length === 0 ) ){
			this.plugin.logger.warn( `Stripping menu item ${getNodePath( node, parent )} because it has no children.` );
			return [];
		}
		const nodeReflection = this._getNodeReflection( node, parent, io );
		if( !( nodeReflection.module instanceof ProjectReflection ) && nodeReflection.isModuleRoot ){
			// If the node is attached to a new module, skip changes in the input tree (stay at root of `pages` in module)
			childrenIO.input = io.input;
			// Output is now like `pkg-a/pages/...`
			childrenIO.output = `${nodeReflection.name.replace( /[^a-z0-9]/gi, '_' )}/${io.output ?? ''}`;
		}
		this.project.registerReflection( nodeReflection );
		this.addNodeToProjectAsChild( nodeReflection );
    // strip a hidden node, but *after* adding its source to the project as a child
		if( node.title === 'HIDDEN' ){
			return node.children ?
				this._mapPagesToReflections( node.children, parent, childrenIO ) :
				[];
		}
		const children = node.children ?
			this._mapPagesToReflections(
				node.children,
				nodeReflection,
				childrenIO ) :
			[];
		nodeReflection.children = children;
		return [ nodeReflection ];
	}

	/**
	 * Generate a node reflection.
	 *
	 * @param node - The node.
	 * @param parent - The parent of this node (project, module or node).
	 * @param io - This node input/output paths.
	 * @returns the node reflection.
	 */
	private _getNodeReflection( node: IPageNode, parent: ProjectReflection | DeclarationReflection, io: IIOPath ){
		const module: ProjectReflection | DeclarationReflection = parent instanceof ProjectReflection ? // If module is project (the default for root), see if workspace is overriden.
			catchWrap(
				() => this._getModule( parent, node.title ),
				`Invalid node workspace override ${getNodePath( node, parent )}`,
			) ?? parent : // Otherwise, we are either in a child page, or in a module.
			parent instanceof ANodeReflection ? // If child page, inherit module
				parent.module : // Otherwise, use module as parent
				parent;
		if(
			( parent instanceof ANodeReflection && module !== parent.module ) ||
			( !( parent instanceof ANodeReflection ) && module !== parent )
		){
			parent = module;
		}
		if( node.source ){
			const filename = this._pathReflectionResolver.resolveNamedPath( parent.project, join( io.input, node.source ), { currentReflection: module } );
			if( !filename ){
				throw new Error( `Could not locate page for ${getNodePath( node, parent )}` );
			}
			return catchWrap(
				() => new PageReflection(
					node.title,
					this.getReflectionKind( PagesPluginReflectionKind.PAGE ),
					module,
					parent,
					filename,
					join( io.output, getNodeUrl( node ) ) ),
				`Could not generate a page reflection for ${getNodePath( node, parent )}` );
		}
		return new MenuReflection(
			node.title,
			this.getReflectionKind( PagesPluginReflectionKind.MENU ),
			module,
			parent );
	}
}
