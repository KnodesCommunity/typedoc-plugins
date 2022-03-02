import assert from 'assert';
import { existsSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';

import { isString, uniq } from 'lodash';
import { LiteralUnion } from 'type-fest';
import { DeclarationReflection, ProjectReflection, Reflection, ReflectionKind } from 'typedoc';

import type { ABasePlugin } from './base-plugin';

/**
 * Don't worry about typings, it's just a string with special prefixes.
 */
export type NamedPath = LiteralUnion<NamedPath.Project | NamedPath.Module, string>
export namespace NamedPath {
	export type Project = `~~/${string}`;
	export type Module = `~${string}/${string}`
}
export class PathReflectionResolver {
	public constructor( protected readonly plugin: ABasePlugin ){}

	/**
	 * Resolve the path from the {@link reflection} sources. A single match is expected.
	 *
	 * @param reflection - The reflection to resolve from.
	 * @param path - The path to resolve.
	 * @returns the resolved path.
	 */
	public resolveFromReflection( reflection: Reflection, path: string ): string | undefined {
		const resolved = this.resolveAllFromReflection( reflection, path );
		const sourcesLog = `Reflection sources: ${JSON.stringify( reflection.sources?.map( s => s.fileName ) ?? [] )}`;
		if( resolved.length === 0 ){
			this.plugin.logger.error( `Could not resolve "${path}" from reflection "${reflection.name}". ${sourcesLog}` );
		} else if( resolved.length > 1 ){
			this.plugin.logger.warn( `Multiple files exists for resolution of "${path}" from reflection "${reflection.name}". Picking the first. ${sourcesLog}` );
		}
		return resolved[0];
	}

	/**
	 * Resolve the path from the {@link reflection} sources. Filter only existing files.
	 *
	 * @param reflection - The reflection to resolve from.
	 * @param path - The path to resolve.
	 * @returns the resolved path.
	 */
	public resolveAllFromReflection( reflection: Reflection, path: string ): string[]{
		if( isAbsolute( path ) ){
			return [ path ];
		}
		return reflection.sources
			?.map( s => {
				const source = s?.fileName;
				if( !source ){
					return undefined;
				} else {
					return resolve( dirname( source ), path );
				}
			} )
			.filter( isString )
			.filter( existsSync ) ?? [];
	}

	/**
	 * Get a list of workspaces from the given {@link project}.
	 *
	 * @param project - The project reflection.
	 * @returns the workspaces.
	 */
	public getWorkspaces( project: ProjectReflection ): [ProjectReflection, ...DeclarationReflection[]] {
		const modules = project.getReflectionsByKind( ReflectionKind.Module );
		assert( modules.every( ( m ): m is DeclarationReflection => m instanceof DeclarationReflection ) );
		return [
			project,
			...modules,
		];
	}

	/**
	 * Resolve the given {@link path}, converting `~~` as the project path, & `~*` as modules path.
	 *
	 * @param project - The project reflection.
	 * @param path - The page targetted.
	 * @param extra - An object containing:
	 * - the default container folder for named paths
	 * - the current reflection for relative paths.
	 * @returns the resolved file.
	 */
	public resolveNamedPath(
		project: ProjectReflection,
		path: NamedPath,
		{ containerFolder, currentReflection }: {containerFolder?: string; currentReflection?: Reflection} = {},
	){
		const pathSv = path;
		const pathsToTry = [];
		if( path.startsWith( '~~/' ) ){
			path = path.replace( /^~~\//, '' );
			currentReflection = project;
			if( containerFolder ){
				pathsToTry.push( join( containerFolder, path ) );
			}
			pathsToTry.push( path );
		} else if( path.match( /^~.+\// ) ){
			const workspace = this.getWorkspaces( project ).slice( 1 ).find( w => path.startsWith( `~${w.name}/` ) );
			if( !workspace ){
				throw new Error( `Could not get a module corresponding to the path ${path.slice( 1 )}` );
			}
			path = path.slice( workspace.name.length + 2 );
			currentReflection = workspace;
			if( containerFolder ){
				pathsToTry.push( join( containerFolder, path ) );
			}
			pathsToTry.push( path );
		} else {
			pathsToTry.push( path );
		}
		const reflection = currentReflection ?? project;
		for( const p of uniq( pathsToTry ).reverse() ){
			const ret = this.resolveAllFromReflection( reflection, p );
			if( ret.length > 0 ) {
				return ret[0];
			}
		}
		const sourcesLog = `Reflection sources: ${JSON.stringify( reflection.sources?.map( s => s.fileName ) ?? [] )}`;
		this.plugin.logger.error( `Could not resolve "${pathSv}" from reflection "${reflection.name}". ${sourcesLog}` );
		return undefined;
	}
}
