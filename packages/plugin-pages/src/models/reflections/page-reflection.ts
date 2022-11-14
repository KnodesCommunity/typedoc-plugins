import { ProjectReflection, SourceReference, normalizePath } from 'typedoc';

import { ANodeReflection } from './a-node-reflection';
import { PagesPluginReflectionKind } from './reflection-kind';

const removeTrailingIndex = ( path: string ) => path.replace( /(\/index)+$/, '' );

export class PageReflection extends ANodeReflection {
	public readonly namedPath: string;
	public constructor(
		name: string,
		module: ANodeReflection.Module,
		parent: ANodeReflection.Parent | undefined,
		public readonly content: string,
		public readonly sourceFilePath: string,
		public readonly pageVirtualPath: string,
		public readonly url: string,
	){
		super( name, PagesPluginReflectionKind.PAGE, module, parent );
		this.sources = [
			new SourceReference( sourceFilePath, 1, 1 ),
		];

		this.relevanceBoost = 5;

		const namedPathRoot = this.module instanceof ProjectReflection ? '~~' : `~${this.module.name}`;
		this.namedPath = normalizePath( `${namedPathRoot}:${pageVirtualPath}` );
	}

	/**
	 *
	 * @param virtualPath
	 */
	public matchVirtualPath( virtualPath: string ): boolean {
		return normalizePath( removeTrailingIndex( virtualPath ) ) === normalizePath( removeTrailingIndex( this.namedPath ) );
	}
}
