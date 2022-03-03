import { DeclarationReflection, ProjectReflection, ReflectionKind } from 'typedoc';

import { ANodeReflection } from './a-node-reflection';

export class MenuReflection extends ANodeReflection {
	public constructor(
		name: string,
		kind: ReflectionKind,
		module: ProjectReflection | DeclarationReflection,
		parent?: ProjectReflection | DeclarationReflection,
	){
		super( name, kind, module, parent );
	}
}
