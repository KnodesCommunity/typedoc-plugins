export enum EBlockMode {
	DEFAULT = 'default',
	EXPANDED = 'expanded',
	FOLDED = 'folded',
}
export interface ICodeBlock {
	sourceFile: string;
	asFile: string;
	mode: EBlockMode;
	content: string;
	url?: string;
}
