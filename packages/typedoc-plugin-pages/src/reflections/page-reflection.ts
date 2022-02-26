import { Reflection, ReflectionKind } from 'typedoc';

import { ANodeReflection } from './a-node-reflection';

export interface IPageParams {
	filename: string;
	content: string;
	url: string;
}
export class PageReflection extends ANodeReflection implements IPageParams {
	public constructor(
		name: string,
		kind: ReflectionKind,
		public readonly filename: string,
		public readonly content: string,
		public readonly url: string,
		public readonly parent?: Reflection,
	){
		super( name, kind, parent );
		this.sources = [
			{ character: 0, fileName: filename, line: 1 },
		];
	}
}
