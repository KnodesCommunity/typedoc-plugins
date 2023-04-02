import { LogLevel } from 'typedoc';

import { AnyLoaderRawPageNode } from '../converter/loaders';

export enum EInvalidPageLinkHandling {
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
	 * The pages definition.
	 *
	 * @see {@page pages-tree} for details.
	 */
	pages: AnyLoaderRawPageNode[];

	/**
	 * Whether or not `{@page ...}` tag should be parsed.
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
	 * The kind of error to throw in case of an invalid page link.
	 *
	 * @default {@link EInvalidPageLinkHandling.LOG_ERROR}
	 */
	invalidPageLinkHandling: EInvalidPageLinkHandling;

	/**
	 * Output directory where your pages will be rendered.
	 *
	 * @default 'pages'
	 */
	output: string;

	/**
	 * The plugin log level.
	 *
	 * @default application.logger.level
	 */
	logLevel: LogLevel;

	/**
	 * A list of markdown captures to omit. Should have the form `{@....}`.
	 */
	excludeMarkdownTags?: string[];

	/**
	 * The container in packages to search for pages in "{@page ...}" tags.
	 */
	linkModuleBase: string | null;

	/**
	 * The directory name where to output diagnostics data.
	 */
	diagnostics?: string;
}
