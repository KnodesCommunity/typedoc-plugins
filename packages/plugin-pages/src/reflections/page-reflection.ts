import { readFileSync } from 'fs';
import { relative } from 'path';

import { Comment, DeclarationReflection, ProjectReflection, ReflectionKind, SourceFile } from 'typedoc';

import { rethrow, wrapError } from '@knodes/typedoc-pluginutils';

import { ANodeReflection } from './a-node-reflection';

export class PageReflection extends ANodeReflection {
	public readonly content: string;
	public constructor(
		name: string,
		kind: ReflectionKind,
		module: ProjectReflection | DeclarationReflection,
		parent: ProjectReflection | DeclarationReflection | undefined,
		public readonly sourceFilePath: string,
		public readonly url: string,
	){
		super( name, kind, module, parent );
		this.content = rethrow(
			() => readFileSync( sourceFilePath, 'utf-8' ),
			err => wrapError( `Error during reading of ${relative( process.cwd(), sourceFilePath )}`, err ) );
		this.sources = [
			{ character: 0, fileName: sourceFilePath, line: 1, url, file: new SourceFile( sourceFilePath ) },
		];
		this.comment = new Comment( undefined, this.content );
	}
}
