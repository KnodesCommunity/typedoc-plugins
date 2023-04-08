import { ANodeReflection } from './a-node-reflection';
import { PagesPluginReflectionKind } from './reflection-kind';

export class MenuReflection extends ANodeReflection {
	public constructor(
		name: string,
		module: ANodeReflection.Module,
		parent: ANodeReflection.Parent | undefined,
	){
		super( name, PagesPluginReflectionKind.MENU, module, parent );
	}
}
