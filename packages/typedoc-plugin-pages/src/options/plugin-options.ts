import { LogLevel } from 'typedoc';

import { IRootPageNode } from './pages';

export enum EInvalidPageLinkHandling{
	FAIL,
	LOG_ERROR,
	LOG_WARN,
	NONE
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
	enablePageLinks?: boolean;

	/**
	 * Whether or not the pages should be added to the search index.
	 *
	 * @default true
	 */
	enableSearch?: boolean;

	/**
	 * The score multiplier for pages in search.
	 *
	 * @default 10
	 */
	searchBoost?: number;

	/**
	 * The kind of error to throw in case of an invalid page link.
	 *
	 * @default EInvalidPageLinkHandling.FAIL
	 */
	invalidPageLinkHandling?: EInvalidPageLinkHandling;

	/**
	 * Actual pages definitions.
	 */
	pages?: IRootPageNode[];

	/**
	 * Output directory where your pages will be rendered.
	 *
	 * @default "pages".
	 */
	output?: string;

	/**
	 * Root directory where all page source files live.
	 *
	 * @default "pages"
	 */
	source?: string;

	/**
	 * The plugin log level.
	 *
	 * @default application.logger.level
	 */
	logLevel?: LogLevel;
}

