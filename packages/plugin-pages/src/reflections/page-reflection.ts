import { readFileSync } from 'fs';
import { relative } from 'path';

import { Comment, DeclarationReflection, ProjectReflection, ReflectionKind, SourceReference } from 'typedoc';

import { catchWrap } from '@knodes/typedoc-pluginutils';

import { ANodeReflection } from './a-node-reflection';

export class PageReflection extends ANodeReflection {
	public readonly content: string;
	public constructor(
		name: string,
		kind: ReflectionKind,
		module: ProjectReflection | DeclarationReflection,
		parent: ProjectReflection | DeclarationReflection | undefined,
		public readonly sourceFilePath: string,
		public url: string,
	){
		super( name, kind, module, parent );
		this.content = catchWrap(
			() => readFileSync( sourceFilePath, 'utf-8' ),
			`Could not read ${relative( process.cwd(), sourceFilePath )}` );
		this.sources = [
			new SourceReference( sourceFilePath, 1, 1 ),
		];
		this.comment = new Comment( [ { kind: 'text', text: this.content } ] );

		this.relevanceBoost = 5;
	}
}
