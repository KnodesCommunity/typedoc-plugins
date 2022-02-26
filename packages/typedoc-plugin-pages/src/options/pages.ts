import { LiteralUnion } from 'type-fest';

export interface IPageNode {
	children?: IPageNode[];
	childrenDir?: string;
	childrenSourceDir?: string;
	childrenOutputDir?: string;
	output?: string;
	source?: string;
	title: LiteralUnion<'VIRTUAL', string>;
}

export interface IRootPageNode extends IPageNode {
	workspace?: string;
}

export type PageNode = IRootPageNode | IPageNode;
