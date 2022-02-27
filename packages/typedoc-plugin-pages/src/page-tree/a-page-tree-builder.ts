import assert from 'assert';
import { resolve } from 'path';

import { DeclarationReflection, ProjectReflection, ReflectionKind, RenderTemplate, RendererEvent, Theme, UrlMapping } from 'typedoc';

import { rethrow } from '@knodes/typedoc-pluginutils';

import { IPluginOptions, IRootPageNode, PageNode } from '../options';
import type { PagesPlugin } from '../plugin';
import { MenuReflection, NodeReflection, PageReflection, PagesPluginReflectionKind } from '../reflections';
import { ANodeReflection } from '../reflections/a-node-reflection';
import { RenderPageLinkProps } from '../theme';
import { IPageTreeBuilder } from './types';
import { getDir, getNodePath, getNodeUrl, join } from './utils';

interface IIOPath {
	input?: string;
	output?: string;
}
export abstract class APageTreeBuilder implements IPageTreeBuilder {
	public abstract renderPageLink: RenderTemplate<RenderPageLinkProps>;
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
	 * @param reflections - The list of node reflections (pages & menu).
	 * @returns the list of mappings to create.
	 */
	protected abstract generateMappings( reflections: NodeReflection[] ): Array<UrlMapping<PageReflection>>;
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
			this._mappings = this.generateMappings( reflections );
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
	 * Map multiple raw page node objects to node reflections.
	 *
	 * @param nodes - The nodes.
	 * @param parent - The parent of this node (project, module or node).
	 * @param io - The children base input/output paths
	 * @returns the node reflections.
	 */
	private _mapPagesToReflections( nodes: PageNode[], parent: ProjectReflection | DeclarationReflection, io: IIOPath ): NodeReflection[] {
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
		const childrenIO = {
			input: join( io.input, getDir( node, 'source' ) ),
			output: join( io.output, getDir( node, 'output' ) ),
		};
		if( node.title === 'VIRTUAL' ){
			return node.children ?
				this._mapPagesToReflections(
					node.children,
					rethrow(
						() => this._getNodeModuleOverride( node ),
						err => `Invalid virtual module ${getNodePath( node, parent )}:\n${err.message}`,
					) ?? parent,
					childrenIO ) :
				[];
		}
		const nodeReflection = this._getNodeReflection( node, parent, io );
		this.project.registerReflection( nodeReflection );
		const children = node.children ?
			this._mapPagesToReflections(
				node.children,
				nodeReflection,
				childrenIO ) :
			[];
		nodeReflection.children = children;
		this.addNodeToProjectAsChild( nodeReflection );
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
	private _getNodeReflection( node: PageNode, parent: ProjectReflection | DeclarationReflection, io: IIOPath ){
		const module: ProjectReflection | DeclarationReflection = parent instanceof ProjectReflection ? // If module is project (the default for root), see if workspace is overriden.
			rethrow(
				() => this._getNodeModuleOverride( node ),
				err => `Invalid node workspace override ${getNodePath( node, parent )}:\n${err.message}`,
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
			const filename = resolve( join( io.input, node.source ) );
			return rethrow(
				() => new PageReflection(
					node.title,
					this.getReflectionKind( PagesPluginReflectionKind.PAGE ),
					module,
					parent,
					filename,
					join( io.output, getNodeUrl( node ) ) ),
				err => `Could not generate a page reflection for ${getNodePath( node, parent )}:\n${err.message}` );
		}
		return new MenuReflection(
			node.title,
			this.getReflectionKind( PagesPluginReflectionKind.MENU ),
			module,
			parent );
	}

	/**
	 * Obtain the container reflection (project or module) the given node should be attached to, depending on its {@link IRootPageNode.workspace}.
	 *
	 * @param node - The node to get the container for.
	 * @returns the target container.
	 */
	private _getNodeModuleOverride( node: PageNode ){
		if( 'workspace' in node && node.workspace ){
			const { workspace } = node;
			const module = this.project.getChildByName( workspace );
			if( !module ){
				const modules = this.project.getReflectionsByKind( ReflectionKind.Module );
				throw new Error( `Could not get a module for workspace named "${workspace}". Known modules are ${JSON.stringify( modules.map( m => m.name ) )}` );
			}
			if( !( module instanceof DeclarationReflection ) || !module.kindOf( ReflectionKind.Module ) ){
				throw new Error( `Found reflection for workspace name "${workspace}" is not a module reflection` );
			}
			return module;
		}
	}
}
( {} as IRootPageNode );
