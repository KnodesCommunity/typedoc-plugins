import { ProjectReflection, SourceReference } from 'typedoc';

import { normalize } from '@knodes/typedoc-pluginutils/path';

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
		this.namedPath = normalize( `${namedPathRoot}:${pageVirtualPath}` );
	}

	/**
	 * Check if the given virtual path matches this page's virtual path.
	 *
	 * @param virtualPath - The path to test.
	 * @returns `true` if virtual paths are equivalent, `false` otherwise.
	 */
	public matchVirtualPath( virtualPath: string ): boolean {
		return normalize( removeTrailingIndex( virtualPath ) ) === normalize( removeTrailingIndex( this.namedPath ) );
	}
}
