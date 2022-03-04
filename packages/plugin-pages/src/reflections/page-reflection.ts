import { readFileSync } from 'fs';
import { relative } from 'path';

import { Comment, DeclarationReflection, ProjectReflection, ReflectionKind, SourceFile } from 'typedoc';

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
			{ character: 0, fileName: sourceFilePath, line: 1, url, file: new SourceFile( sourceFilePath ) },
		];
		this.comment = new Comment( undefined, this.content );
	}
}
