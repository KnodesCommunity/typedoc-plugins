import assert from 'assert';
import { isAbsolute, resolve } from 'path';

import { sync as glob } from 'glob';
import { cloneDeep, uniq } from 'lodash';
import { DeclarationReflection, MinimalSourceFile, ProjectReflection, Reflection, normalizePath } from 'typedoc';

import { IPluginComponent, ResolveError, getWorkspaces, miscUtils, resolveNamedPath } from '@knodes/typedoc-pluginutils';

import { ANodeReflection, MenuReflection, NodeReflection, PageReflection } from '../../models/reflections';
import { IOptionPatternPage, IPageNode, IPluginOptions, IRootPageNode, OptionsPageNode } from '../../options';
import type { PagesPlugin } from '../../plugin';
import { IExpandContext, expandNode } from './expand-context';
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
			const pages = this._expandRootPageNodes( options.pages, options.source );
			if( pages.some( p => p.moduleRoot ) ){
				rootMenu.childrenNodes = this._mapNodesToReflectionsTree(
					pages,
					project,
					{ inputContainer: options.source, output: options.output } );
			} else {
				const projectRoot = new MenuReflection( project.name, project, project, project.url ?? '' );
				projectRoot.childrenNodes = this._mapNodesToReflectionsTree(
					pages,
					projectRoot,
					{ inputContainer: options.source, output: options.output } );
				rootMenu.childrenNodes = projectRoot.childrenNodes.length > 0 ? [ projectRoot ] : [];
			}
			rootMenu.childrenNodes = this._dedupeNodes( rootMenu.childrenNodes );
			return rootMenu;
		}
	}

	/**
	 * Merge identical nodes (identical at this point means same name & module).
	 *
	 * @param nodes - The nodes to dedupe.
	 * @returns the deduped nodes.
	 */
	private _dedupeNodes( nodes: ANodeReflection[] ): ANodeReflection[] {
		return nodes.reduce<ANodeReflection[]>( ( acc, v ) => {
			const existing = acc.find( a => a.module === v.module && a.name === v.name );
			if( existing ){
				if( existing instanceof PageReflection && v instanceof PageReflection ){
					throw new Error( `Deduping ${getNodePath( v )} failed: this page and ${getNodePath( existing )} both has source` );
				}
				v.parent = existing;
				existing.childrenNodes = this._dedupeNodes( uniq( [
					...( existing.childrenNodes ?? [] ),
					...( v.childrenNodes ?? [] ).map( c => {
						c.parent = existing;
						return c;
					} ),
				] ) );
			} else {
				acc.push( v );
			}
			return acc;
		}, [] );
	}

	/**
	 * Expand each page entry for each entrypoint.
	 *
	 * @param pages - A list of pages options to expand.
	 * @param sourceDir - The pages container directory.
	 * @returns the expanded page nodes.
	 */
	private _expandRootPageNodes( pages: IPluginOptions.Page[], sourceDir: string ): IRootPageNode[]{
		const entryPoints = this.plugin.application.options.getValue( 'entryPoints' ).flatMap( ep => glob( ep ) );
		return pages.map( p => this._expandPageNode<IRootPageNode>( entryPoints.map( ep => join( ep, sourceDir ) ), p, [] ) ).flat( 2 );
	}

	/**
	 * Expand the given node or node match from each if the given path sources.
	 *
	 * @param froms - A list of paths to try to expand against.
	 * @param node - The node to expand.
	 * @param prevContexts - A list of previous expansion contexts.
	 * @returns the expanded nodes.
	 */
	private _expandPageNode<T extends IPageNode>( froms: string[], node: OptionsPageNode<T> | IOptionPatternPage<T>, prevContexts: IExpandContext[] = [] ): T[] {
		if( 'match' in node ){
			const matches = froms.flatMap( from => glob( node.match, { cwd: from  } ).map( m => ( {
				from,
				match: normalizePath( m ),
				fullPath: normalizePath( resolve( from, m ) ),
				prev: prevContexts,
			} as IExpandContext ) ) );
			const nodesExpanded = matches.map( m => node.template.map( t => {
				const tClone = cloneDeep( t );
				if( 'children' in tClone ){
					tClone.children = tClone.children?.map( c => this._expandPageNode( [ m.fullPath ], c, [ ...prevContexts, m ] ) ).flat( 1 ) ?? [];
				}
				const expanded = expandNode( tClone, m );
				return expanded;
			} ) ).flat( 1 );
			return nodesExpanded as any;
		}
		const clone = cloneDeep( node );
		if( 'children' in clone ){
			clone.children = clone.children?.map( c => this._expandPageNode( froms, c, [ ...prevContexts ] ) ).flat( 1 ) ?? [];
		}
		return [ clone as any ];
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
		const childrenIO: IIOPath = {
			...io,
			input: join( io.input, getDir( node, 'source' ) ),
			output: join( io.output, getDir( node, 'output' ) ),
		};
		if( node.name === 'VIRTUAL' ){
			return node.children ?
				this._mapNodesToReflectionsTree( node.children, parent, childrenIO ) :
				[];
		}
		const nodeReflection = this._getNodeReflection( node, parent, io );
		if( nodeReflection.isModuleAppendix ){
			childrenIO.input = io.input;
			childrenIO.output = io.output;
			if( !( nodeReflection.module instanceof ProjectReflection ) ){
				// Output is now like `pkg-a/pages/...`
				childrenIO.output = `${nodeReflection.name.replace( /[^a-z0-9]/gi, '_' )}/${io.output ?? ''}`;
			}
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
				() => this._getModule( parent, node.name ),
				`Invalid pages configuration: could not find a workspace named "${node.name}"`,
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
			const nodePath = isAbsolute( node.source ) ? node.source : join( io.input, node.source );
			const sourceFilePath = miscUtils.catchWrap(
				() => resolveNamedPath( module, io.inputContainer ?? undefined, nodePath ),
				err => {
					const path = err instanceof ResolveError ? `./${this.plugin.relativeToRoot( err.triedPath )}` : nodePath;
					return new Error( `Could not locate page for ${getNodePath( node, actualParent )}. Searched for "${path}"`, { cause: err } );
				} );
			const page = miscUtils.catchWrap(
				() => new PageReflection(
					node.name,
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
			node.name,
			module,
			actualParent,
			normalizePath( join( io.output, getNodeUrl( { output: 'index.html', ...node } ) ) ) );
	}
}
