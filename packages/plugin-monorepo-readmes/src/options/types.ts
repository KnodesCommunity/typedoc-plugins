import { LogLevel } from 'typedoc';

/**
 * Plugin options
 */
export interface IPluginOptions {
	/**
	 * A list of file names used to infer packages root.
	 *
	 * @default `["package.json"]`
	 */
	rootFiles: string[];

	/**
	 * The plugin log level.
	 *
	 * @default application.logger.level
	 */
	logLevel: LogLevel;
}

