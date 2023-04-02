import assert from 'assert';
import { existsSync, readdirSync } from 'fs';

import { memoize } from 'lodash';
import { LiteralUnion } from 'type-fest';
import { DeclarationReflection, ProjectReflection, Reflection, ReflectionKind, normalizePath } from 'typedoc';

import { dirname, parse, resolve  } from './utils/path';

const isRootFile = ( dir: string, file: string ) => !!( file.match( /^readme.md$/i ) || file.match( /^package.json$/ ) );
export const findModuleRoot = memoize( ( reflection: Reflection, rootMatcher: ( dir: string, file: string ) => boolean = isRootFile ) => {
	const projectReflection = reflection.project;
	const projectRootFile = projectReflection.sources?.find( src => {
		const { dir, base } = parse( src.fullFileName );
		return rootMatcher( dir, base );
	} )?.fullFileName ?? assert.fail( 'Can\'t get the project root' );
	const projectRootDir = normalizePath( dirname( projectRootFile ) );
	if( reflection === projectReflection ){
		return projectRootDir;
	}
	for ( const source of reflection.sources ?? [] ) {
		const root = _findModuleRoot( normalizePath( dirname( source.fullFileName ) ), projectRootDir, rootMatcher );
		if( root ){
			return root;
		}
	}
	return dirname( reflection.sources?.[0].fullFileName ?? assert.fail( `Reflection ${reflection.getFriendlyFullName()} has no known source` ) );
} );
const _findModuleRoot = memoize( ( moduleDir: string, projectRoot: string, rootMatcher: ( dir: string, file: string ) => boolean ): string | null => {
	if( moduleDir === projectRoot ){
		return null;
	}
	const files = readdirSync( moduleDir );
	if( files.some( f => rootMatcher( moduleDir, f ) ) ){
		return moduleDir;
	}
	return _findModuleRoot( normalizePath( dirname( moduleDir ) ), projectRoot, rootMatcher );
} );

export const getWorkspaces = ( project: ProjectReflection ): [ProjectReflection, ...DeclarationReflection[]] => {
	const modules = project.getReflectionsByKind( ReflectionKind.Module );
	assert( modules.every( ( m ): m is DeclarationReflection => m instanceof DeclarationReflection ) );
	return [
		project,
		...modules,
	];
};
export const isModule = ( reflection: Reflection ): reflection is DeclarationReflection => reflection instanceof DeclarationReflection && reflection.kindOf( ReflectionKind.Module );

export const getReflectionParentMatching: {
	<T extends Reflection>( reflection: Reflection, filter: ( reflection: Reflection ) => reflection is T ): T | undefined;
	( reflection: Reflection, filter: ( reflection: Reflection ) => boolean ): Reflection | undefined;
} = ( reflection: Reflection, filter: ( reflection: Reflection ) => boolean ) => {
	let reflectionCursor = reflection as Reflection | undefined;
	while( reflectionCursor ){
		if( filter( reflectionCursor ) ){
			return reflectionCursor;
		}
		reflectionCursor = reflectionCursor.parent;
	}
	return reflectionCursor;
};

export const getReflectionModule = ( reflection: Reflection ) => getReflectionParentMatching( reflection, isModule ) ?? reflection.project;

/**
 * Don't worry about typings, it's just a string with special prefixes. See {@page resolving-paths.md} for details.
 */
export type NamedPath = LiteralUnion<NamedPath.Relative | NamedPath.Project | NamedPath.ExplicitModule | NamedPath.CurrentModule, string>
export namespace NamedPath {
	export type Relative = `.${'.' | ''}/${string}`;
	export type Project = `~~:${string}`;
	export type ExplicitModule = `~${string}:${string}`
	export type CurrentModule = LiteralUnion<`~:${string}`, string>
}

export class ResolveError extends Error {
	public constructor( public readonly triedPath: string, options?: ErrorOptions ){
		super( `Could not resolve ${triedPath}`, options );
	}
}

/**
 * Resolve a named path. See {@page resolving-paths.md} for details.
 *
 * @param args - The reflection to resolve from, an optional container folder, and the target path specifier.
 * @returns the resolved path.
 */
export const resolveNamedPath: {
	/**
	 * Resolve a named path. See {@page resolving-paths.md} for details.
	 *
	 * @param currentReflection - The reflection to resolve from.
	 * @param containerFolder - An optional container folder.
	 * @param path - The target path specifier.
	 * @returns the resolved path.
	 */
	( currentReflection: Reflection, containerFolder: string | undefined, path: NamedPath ): string;
	/**
	 * Resolve a named path. See {@page resolving-paths.md} for details.
	 *
	 * @param currentReflection - The reflection to resolve from.
	 * @param path - The target path specifier.
	 * @returns the resolved path.
	 */
	( currentReflection: Reflection, path: NamedPath ): string;
} = ( ...args: [Reflection, string | undefined, NamedPath] | [Reflection, NamedPath] ) => {
	const [ currentReflection, containerFolder, path ] = args.length === 3 ? args : [ args[0], undefined, args[1] ];
	let containerFolderMut = containerFolder;
	let pathMut = normalizePath( path );
	let reflectionRoots = findModuleRoot( getReflectionModule( currentReflection ) );
	if( pathMut.startsWith( '~~:' ) ){
		pathMut = pathMut.slice( 3 );
		reflectionRoots = findModuleRoot( currentReflection.project );
	} else if( pathMut.match( /^~.+?:/ ) ){
		const workspaces = getWorkspaces( currentReflection.project ).slice( 1 ).filter( w => pathMut.startsWith( `~${w.name}:` ) );
		const workspace = workspaces[0];
		if( !workspace ){
			throw new Error( `Could not get a module corresponding to the path ${path.slice( 1 )}` );
		} else if( workspaces.length > 1 ){
			throw new Error( `Ambiguous reference for path ${pathMut}. Matched ${workspaces.map( w => w.name ).join( ', ' )}` );
		}
		pathMut = pathMut.slice( workspace.name.length + 2 );
		reflectionRoots = findModuleRoot( workspace );
	} else if( pathMut.match( /^~:/ ) ){
		pathMut = pathMut.slice( 2 );
		reflectionRoots = findModuleRoot( getReflectionModule( currentReflection ) );
	} else if( pathMut.match( /^\.{1,2}\// ) ) {
		containerFolderMut = undefined;
		reflectionRoots = dirname( currentReflection.sources?.[0].fullFileName ?? assert.fail() );
	}

	assert( reflectionRoots );
	const resolved = normalizePath( resolve( reflectionRoots, containerFolderMut ?? '.', pathMut ) );
	if( existsSync( resolved ) ){
		return resolved;
	}
	throw new ResolveError( resolved );
};
