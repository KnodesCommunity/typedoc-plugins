import { Application, LogLevel, Logger } from 'typedoc';

import type { ABasePlugin } from './base-plugin';

export class PluginLogger implements Pick<Logger, 'verbose' | 'info' | 'warn' | 'error' | 'log' | 'deprecated'> {
	public constructor( private readonly _app: Application, private readonly _plugin: ABasePlugin, private readonly _context?: string ){}

	/**
	 * Create a new {@link PluginLogger} for the given context.
	 *
	 * @param context - The new logger context.
	 * @returns the new logger.
	 */
	public makeChildLogger( context?: string ){
		return new PluginLogger( this._app, this._plugin, context );
	}

	/**
	 * Log the given verbose message.
	 *
	 * @param text  - The message that should be logged.
	 */
	public verbose( text: string ): void {
		this._app.logger.verbose( this._formatMessage( text ) );
	}

	/**
	 * Log the given info message.
	 *
	 * @param text  - The message that should be logged.
	 */
	public info( text: string ): void {
		this._app.logger.info( this._formatMessage( text ) );
	}

	/**
	 * Log the given warning message.
	 *
	 * @param text  - The warning that should be logged.
	 */
	public warn( text: string ): void {
		this._app.logger.warn( this._formatMessage( text ) );
	}

	/**
	 * Log the given error message.
	 *
	 * @param text  - The error that should be logged.
	 */
	public error( text: string ): void {
		this._app.logger.error( this._formatMessage( text ) );
	}

	/**
	 * Print a log message.
	 *
	 * @param message  - The message itself.
	 * @param level  - The urgency of the log message.
	 */
	public log( message: string, level: LogLevel ): void {
		this._app.logger.log( this._formatMessage( message ), level );
	}

	/**
	 * Log the given deprecation message.
	 *
	 * @param text  - The message that should be logged.
	 * @param addStack - TODO: Not sure why ?
	 */
	public deprecated( text: string, addStack?: boolean ): void {
		this._app.logger.deprecated( this._formatMessage( text ), addStack );
	}

	/**
	 * Format the given message.
	 *
	 * @param message - The message to format.
	 * @returns the formatted message;
	 */
	private _formatMessage( message: string ){
		let fullMessage = `[${this._plugin.package.name}]`;
		if( this._context ){
			fullMessage += ': ';
			fullMessage += this._context;
		}
		fullMessage += ' ⇒ ';
		fullMessage += message;
		return fullMessage;
	}
}
