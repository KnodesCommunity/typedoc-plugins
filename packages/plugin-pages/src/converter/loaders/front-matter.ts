import assert from 'assert';
import { readFileSync } from 'fs';
import { basename, extname, join, relative, resolve } from 'path';
import { format } from 'util';

import frontMatter from 'front-matter';
import { load as loadYaml } from 'js-yaml';
import { isObject, last, lowerCase, uniqBy, upperFirst } from 'lodash';
import { normalizePath } from 'typedoc';

import { IPluginComponent, PluginAccessor, getPlugin } from '@knodes/typedoc-pluginutils';

import type { PagesPlugin } from '../../plugin';
import { trimExt } from '../utils';
import { IBaseRawNode, INodeLoader, IRegisterNodeContext, NodeGenerator, SourceNode, UnknownNode, nodeHasFile } from './nodes';
import { GlobMatch, globMatch, isValidGlobMatch } from './utils';

const autoName = ( dirOrFile: string ) => upperFirst( lowerCase( basename( dirOrFile, extname( dirOrFile ) ) ) );

// @LEGACY -- Remove @experimental for v0.24
/**
 * @experimental
 */
export class FrontMatterNodeLoader implements IPluginComponent<PagesPlugin>, INodeLoader<FrontMatterNodeLoader.IRawNode> {
	private readonly _logger = this.plugin.logger.makeChildLogger( this.constructor.name );
	public constructor( private readonly _parent: PluginAccessor<PagesPlugin>, public readonly plugin = getPlugin( _parent ) ) {}

	/**
	 * Check if the node can be loaded by this loader.
	 *
	 * @param rawNode - The node to check.
	 * @returns `true` if this loader can be used to load this node.
	 */
	public canHandle( rawNode: UnknownNode ): boolean {
		return 'loader' in rawNode && rawNode.loader === 'frontMatter';
	}

	/**
	 * Asserts that the given node has a valid config for this loader.
	 *
	 * @param rawNode - The node to check.
	 */
	public checkConfigNode( rawNode: UnknownNode ): asserts rawNode is FrontMatterNodeLoader.IRawNode {
		assert(
			'root' in rawNode && isValidGlobMatch( rawNode.root ),
			format( 'Node %O should have a `root` string (or string array)', rawNode ) );
	}

	/**
	 * Expand & yield menus & pages from the given node.
	 *
	 * @param rawNode - The node to register.
	 * @param context - The context of the current collection. Contains an utility to recurse, a list of parent nodes, and an arbitrary data store generated by parents.
	 * @yields a list of nodes along with their parents
	 */
	public *collectNodes( rawNode: FrontMatterNodeLoader.IRawNode, { parents }: IRegisterNodeContext ): NodeGenerator {
		assert( parents.length === 1, 'Front matter nodes can only be used at root of `pages`.' );
		const module = last( parents ) ?? assert.fail();
		assert( nodeHasFile( module ) );
		const moduleDir = module.path.fs;
		const roots = globMatch( rawNode.root, { from: moduleDir } );
		for( const root of roots ){
			const files = globMatch( '**/*.{md,y?(a)ml}', { from: join( moduleDir, root ) } ).map( normalizePath );
			for( const { node, parents: loadedParents } of this._loadFilesList( moduleDir, root, '.', files ) ){
				yield { node, parents: [ ...loadedParents, ...parents ] };
			}
		}
	}

	/**
	 *
	 * @param moduleDir
	 * @param rootDir
	 * @param relDir
	 * @param files
	 * @param graph
	 * @param moduleVirtualPath
	 */
	private *_loadFilesList( moduleDir: string, rootDir: string, relDir: string, files: string[]  ): NodeGenerator {
		const sorted = files.sort();
		const filesByDir = sorted.map( f => ( {
			file: f,
			dir: ( [
				null,
				...normalizePath( relative( relDir, f ) )
					.split( '/', 2 ),
			].slice( -2 ) )[0],
		} ) );

		// Find if there is an index file
		const index = filesByDir.find( ( { dir, file } ) => dir === null && trimExt( basename( file ) ) === 'index' );
		const defaultDirNodeName = autoName( join( rootDir, relDir ) );
		const indexNode = index ?
			this._loadFile( moduleDir, rootDir, index.file, defaultDirNodeName ) :
			relDir === '.' ? undefined : { name: defaultDirNodeName };
		if( indexNode ){
			yield { node: indexNode, parents: [] };
		}
		const thisDirParents = indexNode ? [ indexNode ] : [];

		// Load children in order
		const nonIndex = filesByDir.filter( fbd => fbd !== index );
		for( const { file, dir } of uniqBy( nonIndex, fbd => fbd.dir ?? fbd.file ) ){
			if( dir ){
				for( const { node, parents } of this._loadFilesList(
					moduleDir,
					rootDir,
					normalizePath( join( relDir, dir ) ),
					filesByDir.filter( fbd => fbd.dir === dir ).map( fbd => fbd.file ) )
				){
					yield { node, parents: [ ...thisDirParents, ...parents ] };
				}
			} else {
				yield { node: this._loadFile( moduleDir, rootDir, file ), parents: thisDirParents };
			}
		}
	}

	/**
	 *
	 * @param moduleDir
	 * @param rootDir
	 * @param filePath
	 * @param nodeGraph
	 * @param moduleVirtualPath
	 * @param defaultName
	 */
	private _loadFile( moduleDir: string, rootDir: string, filePath: string, defaultName = autoName( filePath ) ): SourceNode {
		const fullFilePath = resolve( moduleDir, rootDir, filePath );
		const content = readFileSync( fullFilePath, 'utf-8' );
		const virtual = normalizePath( join( rootDir, trimExt( filePath ) ).replace( /\/index$/, '' ) );
		if( [ 'yaml', 'yml' ].includes( extname( filePath ).slice( 1 ) ) ){
			return {
				name: defaultName,
				...( loadYaml( content ) as object ),
				path: {
					fs: fullFilePath,
					virtual,
				},
			};

		} else {
			const nodeInfos = frontMatter<Record<string, unknown>>( content );
			assert( isObject( nodeInfos.attributes ) );
			const data: SourceNode = {
				name: defaultName,
				...nodeInfos.attributes,
				path: {
					fs: normalizePath( fullFilePath ),
					urlFragment: nodeInfos.attributes.url ? `${nodeInfos.attributes.url}` : undefined,
					virtual,
				},
				content: nodeInfos.body,
			};
			return data;
		}
	}
}
export namespace FrontMatterNodeLoader {
	export interface IRawNode extends IBaseRawNode {
		loader:'frontMatter';
		/**
		 * A directory or list of directories to look for `.md` & `.ya?ml` files.
		 */
		root: GlobMatch;
	}
	export interface ILoadedPageNode {
		name: string;
		file: string;
		content: string;
		parent?: string;
	}
}
