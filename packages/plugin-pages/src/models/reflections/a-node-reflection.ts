import { ContainerReflection, DeclarationReflection, ProjectReflection, TraverseCallback, TraverseProperty } from 'typedoc';

import { PagesPluginReflectionKind } from './reflection-kind';

export class ANodeReflection extends ContainerReflection {
	public get depth(): number {
		return this.parent instanceof ANodeReflection ? this.parent.depth + 1 : 0;
	}
	public get isModuleAppendix(): boolean {
		return this.module === this.parent && this.name === this.module.name;
	}
	public childrenNodes?: ANodeReflection[] | undefined;
	public override children?: undefined;
	public constructor(
		name: string,
		kind: PagesPluginReflectionKind,
		public readonly module: ANodeReflection.Module,
		public override parent: ANodeReflection.Parent = module,
	){
		super( name, kind | ( module === parent ? PagesPluginReflectionKind.ROOT : 0 ) as any, parent );
	}

	/**
	 * Iterate over all children & childrenNodes of this node reflection.
	 *
	 * @param callback - The function to invoke on each child.
	 */
	public override traverse( callback: TraverseCallback ): void {
		super.traverse( callback );
		for( const c of this.childrenNodes?.slice() ?? [] ){
			if ( !callback( c, TraverseProperty.Children ) ) {
				return;
			}
		}
	}
}
export namespace ANodeReflection {
	export type Module = ProjectReflection | DeclarationReflection;
	export type Parent = Module | ANodeReflection;
}
