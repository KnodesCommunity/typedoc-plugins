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
	 * The kind of error to throw in case of an invalid page link.
	 *
	 * @default EInvalidPageLinkHandling.LOG_ERROR
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
}

