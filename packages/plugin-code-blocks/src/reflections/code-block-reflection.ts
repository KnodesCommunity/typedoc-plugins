import { DeclarationReflection } from 'typedoc';

import { ECodeBlockReflectionKind } from './reflection-kind';

export class CodeBlockReflection extends DeclarationReflection {
	public constructor(
		name: string,
		private readonly file: string,
		private readonly code: string,
		private readonly startLine: number,
		private readonly endLine: number,
	){
		super( name, ECodeBlockReflectionKind.CODE_BLOCK as any );
	}
}
