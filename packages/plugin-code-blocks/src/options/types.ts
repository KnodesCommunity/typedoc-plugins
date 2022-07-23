import { LogLevel } from 'typedoc';

import { EBlockMode } from '../types';

export enum EInvalidBlockLinkHandling {
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
	 * The kind of error to throw in case of an invalid code block reference.
	 *
	 * @default EInvalidBlockLinkHandling.LOG_ERROR
	 */
	invalidBlockLinkHandling: EInvalidBlockLinkHandling;

	/**
	 * The default mode for blocks.
	 *
	 * @default EBlockMode.EXPANDED
	 */
	defaultBlockMode: EBlockMode;

	/**
	 * Root directory where all code blocks live.
	 *
	 * @default 'examples'
	 */
	source: string;

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
}

