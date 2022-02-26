import { Reflection, ReflectionKind } from 'typedoc';

import { ANodeReflection } from './a-node-reflection';

export class MenuReflection extends ANodeReflection {
	public constructor( name: string, kind: ReflectionKind, public readonly parent?: Reflection ){
		super( name, kind, parent );
	}
}
