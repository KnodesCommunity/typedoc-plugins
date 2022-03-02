import { LiteralUnion } from 'type-fest';
import { LogLevel } from 'typedoc';

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

export enum EInvalidPageLinkHandling{
	FAIL = 'fail',
	LOG_ERROR = 'logError',
	LOG_WARN = 'logWarn',
	NONE = 'none'
}
/**
 * Plugin options
 */
export interface IPluginOptions {
	/**
	 * Whether or not @page and @pagelink tags should be parsed.
	 *
	 * @default true
	 */
	enablePageLinks: boolean;

	/**
	 * Whether or not the pages should be added to the search index.
	 *
	 * @default true
	 */
	enableSearch: boolean;

	/**
	 * The score multiplier for pages in search.
	 *
	 * @default 10
	 */
	searchBoost: number;

	/**
	 * The kind of error to throw in case of an invalid page link.
	 *
	 * @default {@link EInvalidPageLinkHandling.LOG_ERROR}
	 */
	invalidPageLinkHandling: EInvalidPageLinkHandling;

	/**
	 * Actual pages definitions.
	 */
	pages: IRootPageNode[];

	/**
	 * Output directory where your pages will be rendered.
	 *
	 * @default "pages".
	 */
	output: string;

	/**
	 * Root directory where all page source files live.
	 *
	 * @default "pages"
	 */
	source: string;

	/**
	 * The plugin log level.
	 *
	 * @default application.logger.level
	 */
	logLevel: LogLevel;
}

