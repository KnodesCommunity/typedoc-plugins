import assert from 'assert';

import { escapeRegExp, isNil, isNumber, last, uniq } from 'lodash';
import { JSX, MarkdownEvent } from 'typedoc';

import { ABasePlugin, IPluginComponent, PluginAccessor, getPlugin } from '../../base-plugin';
import { CurrentPageMemo } from '../../current-page-memo';
import { PluginLogger } from '../../plugin-logger';
import { miscUtils, reflectionSourceUtils } from '../../utils';
import { jsxToString } from '../../utils/text';
import { Tag } from '../types';
import { SourceMapContainer } from './source-map-container';

const spitArgs = ( ...args: Parameters<Parameters<typeof String.prototype.replace>[1]> ) => {
	const indexIdx = args.findIndex( isNumber );
	assert( indexIdx > 0 );
	return {
		fullMatch: args[0] as string,
		captures: args.slice( 1, indexIdx ) as Array<string | null>,
		index: args[indexIdx] as number,
		source: args[indexIdx + 1] as string,
	};
};
const mergeFlags = ( ...flags: string[] ) => uniq( flags.join( '' ).split( '' ) ).join( '' );
const buildMarkdownRegExp = ( tagName: string, paramsRegExp: RegExp | null ) => paramsRegExp ?
	new RegExp( `${escapeRegExp( tagName )}(?:\\s+${paramsRegExp.source})?`, mergeFlags( paramsRegExp.flags, 'g' ) ) :
	new RegExp( `${escapeRegExp( tagName )}`, 'g' );

export class MarkdownReplacer implements IPluginComponent {
	private static readonly _mapContainers = new WeakMap<MarkdownEvent, SourceMapContainer>();

	public readonly plugin: ABasePlugin;
	private readonly _logger: PluginLogger;
	private readonly _currentPageMemo: CurrentPageMemo;

	/**
	 * Get the list of source map containers for the given event.
	 *
	 * @param event - The event to get source maps for.
	 * @returns the source map list.
	 */
	private static _getEventMapContainer( event: MarkdownEvent ): SourceMapContainer {
		const container = this._mapContainers.get( event ) ?? new SourceMapContainer();
		MarkdownReplacer._mapContainers.set( event, container );
		return container;
	}

	public constructor( pluginAccessor: PluginAccessor ){
		this.plugin = getPlugin( pluginAccessor );
		this._logger = this.plugin.logger.makeChildLogger( 'MarkdownReplacer' );
		this._currentPageMemo = CurrentPageMemo.for( this );
	}

	/**
	 * Register an inline tag (eg. `{@tag ....}`) to replace in markdown with optional params regex and execute a callback to replace it.
	 *
	 * @param tagName - The name of the tag to match.
	 * @param paramsRegExp - An optional regex to capture params.
	 * @param callback - The callback to execute to replace the match.
	 * @param options - Extra options.
	 */
	public registerMarkdownTag( tagName: Tag, paramsRegExp: RegExp | null, callback: MarkdownReplacer.ReplaceCallback, options: MarkdownReplacer.IRegisterOptions = {} ){
		const mdRegexBase = buildMarkdownRegExp( tagName, paramsRegExp );
		const tagRegex = new RegExp( `\\{${mdRegexBase.source}\\s*?\\}`, mdRegexBase.flags );
		this._currentPageMemo.initialize();
		const { excludedMatches, priority } = {
			excludedMatches: [],
			priority: 100,
			...options,
		};
		this.plugin.application.renderer.on(
			MarkdownEvent.PARSE,
			this._processMarkdown.bind(
				this,
				tagRegex,
				( { fullMatch, captures, event }, sourceHint ) => {
					const newFullMatch = fullMatch.slice( 2 ).slice( 0, -1 );
					return callback( { fullMatch: newFullMatch, captures, event }, sourceHint );
				},
				tagName,
				excludedMatches ),
			undefined,
			priority );
	}


	/**
	 * Match every strings for {@link regex} & replace them with the return value of the {@link callback}. This method mutates the {@link event}.
	 *
	 * @param regex - The regex to match.
	 * @param callback - The callback to execute with fullMatch, captures, & a source hint.
	 * @param label - The replacer name.
	 * @param excludeMatches - A list of matches to skip.
	 * @param event - The event to modify.
	 */
	private _processMarkdown(
		regex: RegExp,
		callback: MarkdownReplacer.ReplaceCallback,
		label: string,
		excludeMatches: string[] | undefined,
		event: MarkdownEvent,
	) {
		const originalText = event.parsedText;
		const mapLayer = MarkdownReplacer._getEventMapContainer( event ).addLayer( label, originalText );
		const sourceFile = this._currentPageMemo.hasCurrent ? reflectionSourceUtils.getReflectionSourceFileName( this._currentPageMemo.currentReflection ) : undefined;
		event.parsedText = originalText.replace(
			regex,
			( ...args ) => {
				const { captures, fullMatch, index, source } = spitArgs( ...args );
				if( excludeMatches?.includes( fullMatch ) ){
					return fullMatch;
				}
				const getSourceHint = mapLayer.sourceHint.bind( mapLayer, sourceFile, index );
				const replacement = miscUtils.catchWrap(
					() => jsxToString( callback( { fullMatch, captures, event }, getSourceHint ) ),
					err => `In ${getSourceHint()}: ${err.message}` );
				if( isNil( replacement ) ){
					return fullMatch;
				}
				const lastLine = last( source.slice( 0, index ).split( /\n/ ) );
				const indentedReplacement = lastLine?.match( /^\s+$/ ) ? replacement.replace( /\n/g, `\n${lastLine}` ) : replacement;
				mapLayer.addEdition( index, fullMatch, indentedReplacement );
				return indentedReplacement;
			} );
	}
}
export namespace MarkdownReplacer {
	export type SourceHint = () => string;
	export interface Match {
		fullMatch: string;
		captures: Array<string | null>;
		event: MarkdownEvent;
	}
	export type ReplaceCallback = ( match: Match, sourceHint: SourceHint ) => string | JSX.Element | undefined;

	export interface IRegisterOptions {
		excludedMatches?: string[];
		priority?: number;
	}
}
