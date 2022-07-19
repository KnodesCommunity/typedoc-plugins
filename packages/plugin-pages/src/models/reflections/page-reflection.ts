import { readFileSync } from 'fs';
import { relative } from 'path';

import { Comment, ProjectReflection, SourceReference, normalizePath } from 'typedoc';

import { miscUtils } from '@knodes/typedoc-pluginutils';

import { ANodeReflection } from './a-node-reflection';
import { PagesPluginReflectionKind } from './reflection-kind';

export class PageReflection extends ANodeReflection {
	public readonly content: string;
	public readonly namedPath: string;
	public constructor(
		name: string,
		module: ANodeReflection.Module,
		parent: ANodeReflection.Parent | undefined,
		public readonly sourceFilePath: string,
		nodeVirtualPath: string,
		public readonly url: string,
	){
		super( name, PagesPluginReflectionKind.PAGE, module, parent );
		this.content = miscUtils.catchWrap(
			() => readFileSync( sourceFilePath, 'utf-8' ),
			`Could not read ${relative( process.cwd(), sourceFilePath )}` );
		this.sources = [
			new SourceReference( sourceFilePath, 1, 1 ),
		];
		this.comment = new Comment( [ { kind: 'text', text: this.content } ] );

		this.relevanceBoost = 5;

		const namedPathRoot = this.module instanceof ProjectReflection ? '~~' : `~/${this.module.name}`;
		this.namedPath = normalizePath( `${namedPathRoot}/${nodeVirtualPath}`.toLowerCase() );
	}
}
