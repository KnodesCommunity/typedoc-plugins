import { IRootPageNode } from './pages';

/**
 * Plugin options
 */
export interface IPluginOptions {
	/**
	 * Whether or not @page and @pagelink tags should be parsed
	 *
	 * Defaults to true.
	 */
	enablePageLinks?: boolean;

	/**
	 * Whether or not the pages should be added to the search index
	 *
	 * This defaults to true.
	 */
	enableSearch?: boolean;

	/**
	 * Whether or not invalid page links should fail the TypeDoc build
	 *
	 * This defaults to false.
	 */
	failBuildOnInvalidPageLink?: boolean;

	/**
	 * Page group definitions
	 *
	 * This is where you define the groups your pages live in.
	 */
	pages?: IRootPageNode[];

	/**
	 * Writes a list of any broken page links to the console
	 *
	 * This defaults to false.
	 */
	listInvalidPageLinks?: boolean;

	/**
	 * Output directory where your pages will be rendered.
	 *
	 * This defaults to "pages".
	 */
	output?: string;

	/**
	 * Title for the standard TypeDoc reflection items in the navigation sidebar
	 *
	 * This defaults to "API".
	 */
	reflectionNavigationTitle?: string;

	/**
	 * Root directory where all page source files live
	 *
	 * By default this will point to the directory that TypeDoc is run from.
	 */
	source?: string;
}

