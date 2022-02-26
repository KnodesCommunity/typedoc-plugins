import assert from 'assert';
import { readFileSync } from 'fs';
import { relative } from 'path';

import { SetOptional } from 'type-fest';
import { ContainerReflection, DeclarationReflection, ProjectReflection, ReflectionKind, RenderTemplate, RendererEvent, Theme, UrlMapping } from 'typedoc';

import { IPluginOptions, IRootPageNode, PageNode } from '../options';
import type { PagesPlugin } from '../plugin';
import { MenuReflection, NodeReflection, PageReflection, PagesPluginReflectionKind } from '../reflections';
import { RenderPageLinkProps } from '../theme';
import { IPageTreeBuilder } from './types';
import { getDir, getNodeUrl, getReflectionPath, resolve } from './utils';

export interface IDeepParams {
	module: ContainerReflection;
	depth: number;
}
export type DeepParamsOptModule = SetOptional<IDeepParams, 'module'>;
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
	 * Generate the node (menu item, page) title.
	 *
	 * @param deepParams - The deep params.
	 * @param node - The node.
	 * @returns the node title.
	 */
	protected abstract getNodeTitle( deepParams: IDeepParams, node: PageNode ): string;
	/**
	 * Register the {@link nodeReflection} into the correct reflection (project or module).
	 *
	 * @param deepParams - The deep params.
	 * @param nodeReflection - The node reflection.
	 */
	protected abstract addNodeToProjectAsChild( deepParams: IDeepParams, nodeReflection: NodeReflection ): void;

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
			const reflections = this._mapPagesToReflections( { depth: 0 }, options.pages, options.source, options.output );
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
	 * Generate a node reflection. For a page, the page content is read during this call.
	 *
	 * @param deepParams - The deep params.
	 * @param node - The node.
	 * @param inputDir - The base input directory.
	 * @param outputDir - The base output directory.
	 * @param parent - The optional parent of the generated reflection.
	 * @returns the node reflection.
	 */
	private _getNodeReflection( deepParams: IDeepParams, node: PageNode, inputDir?: string, outputDir?: string, parent?: ContainerReflection ){
		const title = this.getNodeTitle( deepParams, node );
		if( node.source ){
			const filename = resolve( inputDir, node.source );
			try {
				return new PageReflection(
					title,
					this.getReflectionKind( PagesPluginReflectionKind.PAGE ),
					filename,
					readFileSync( filename, 'utf-8' ),
					resolve( outputDir, getNodeUrl( node ) ),
					parent );
			} catch( e: any ) {
				const pagesPath = [ ...getReflectionPath( parent ), node.title ];
				throw new Error( `Error during reading of ${relative( process.cwd(), filename )} (page ${pagesPath.map( v => `"${v}"` ).join( ' -> ' )}): ${e}` );
			}
		}
		return new MenuReflection( title, this.getReflectionKind( PagesPluginReflectionKind.MENU ), parent );
	}

	/**
	 * Map multiple raw page node objects to node reflections.
	 *
	 * @param deepParams - The deep params.
	 * @param nodes - The nodes.
	 * @param inputDir - The base input directory.
	 * @param outputDir - The base output directory.
	 * @param parent - The optional parent of the generated reflection.
	 * @returns the node reflections.
	 */
	private _mapPagesToReflections( deepParams: DeepParamsOptModule, nodes: PageNode[], inputDir?: string, outputDir?: string, parent?: ContainerReflection ): NodeReflection[] {
		return nodes
			.map( n => this._mapPageToReflection( deepParams, n, inputDir, outputDir, parent ) )
			.flat( 1 );
	}

	/**
	 * Map a single raw page node object to node reflections.
	 *
	 * @param deepParams - The deep params.
	 * @param node - The node.
	 * @param inputDir - The base input directory.
	 * @param outputDir - The base output directory.
	 * @param parent - The optional parent of the generated reflection.
	 * @returns the node reflections.
	 */
	private _mapPageToReflection( deepParams: DeepParamsOptModule, node: PageNode, inputDir?: string, outputDir?: string, parent?: ContainerReflection ): NodeReflection[] {
		const selectedParent = this._getNodeProject( node, parent );
		const fullDeepParams = {
			...deepParams,
			...( selectedParent instanceof PageReflection || selectedParent instanceof MenuReflection ?
				{} : // Pages inherit module from their parent
				{ module: selectedParent } ),
		} as IDeepParams;
		if( node.title === 'VIRTUAL' ){
			return node.children ?
				this._mapPagesToReflections(
					fullDeepParams,
					node.children,
					resolve( inputDir, getDir( node, 'source' ) ),
					resolve( outputDir, getDir( node, 'output' ) ),
					selectedParent ) :
				[];
		}
		assert( fullDeepParams.module );
		const nodeReflection = this._getNodeReflection(
			fullDeepParams,
			node,
			inputDir,
			outputDir,
			selectedParent );
		this.project.registerReflection( nodeReflection );
		const children = node.children ?
			this._mapPagesToReflections(
				{ ...fullDeepParams, depth: fullDeepParams.depth + 1 },
				node.children,
				resolve( inputDir, getDir( node, 'source' ) ),
				resolve( outputDir, getDir( node, 'output' ) ),
				nodeReflection ) :
			[];
		nodeReflection.children = children;
		this.addNodeToProjectAsChild( fullDeepParams, nodeReflection );
		return [ nodeReflection ];
	}

	/**
	 * Obtain the container reflection (project or module) the given node should be attached to, depending on its {@link IRootPageNode.workspace}.
	 *
	 * @param node - The node to get the container for.
	 * @param parent - The default parent container.
	 * @returns the target container.
	 */
	private _getNodeProject( node: PageNode, parent?: ContainerReflection ){
		if( 'workspace' in node && node.workspace ){
			const { workspace } = node as IRootPageNode & {workspace: string};
			if( parent ){
				throw new Error( `Node "${node.title}" can't have both a parent & a workspace (have "${workspace}")` );
			}
			const module = this.project.getChildByName( workspace );
			if( !module ){
				const modules = this.project.getReflectionsByKind( ReflectionKind.Module );
				throw new Error( `Could not get a module for workspace named "${workspace}" (in "${node.title}"). Known modules are ${JSON.stringify( modules.map( m => m.name ) )}` );
			}
			if( !( module instanceof DeclarationReflection ) || !module.kindOf( ReflectionKind.Module ) ){
				throw new Error( `Found reflection for workspace name "${workspace}" (in "${node.title}") is not a module reflection` );
			}
			return module;
		} else {
			return parent ?? this.project;
		}
	}
}
