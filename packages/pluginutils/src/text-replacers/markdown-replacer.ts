import assert from 'assert';

import { escapeRegExp, isNil, isNumber, last, uniq } from 'lodash';
import { JSX, MarkdownEvent } from 'typedoc';

import { ABasePlugin, IPluginComponent, PluginAccessor, getPlugin } from '../base-plugin';
import { CurrentPageMemo } from '../current-page-memo';
import { PluginLogger } from '../plugin-logger';
import { miscUtils, reflectionSourceUtils, textUtils } from '../utils';
import { Tag } from './types';

interface ISourceEdit {
	from: number;
	to: number;
	source: string;
	replacement: string;
}
interface ISourceMapContainer {
	readonly editions: ISourceEdit[];
	readonly getEditionContext: ( position: number ) => ( {
		line: number;
		column: number;
		expansions: ISourceMapContainer[];
		index: number;
		source: string;
	} );
	readonly label: string;
	readonly plugin: ABasePlugin;
	readonly regex: RegExp;
}
interface IMapSource {
	line: number;
	column: number;
	expansions: ISourceMapContainer[];
	index: number;
	source: string;
}

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
	private static readonly _mapContainers = new WeakMap<MarkdownEvent, ISourceMapContainer[]>();

	public readonly plugin: ABasePlugin;
	private readonly _logger: PluginLogger;
	private readonly _currentPageMemo: CurrentPageMemo;

	/**
	 * Get the list of source map containers for the given event.
	 *
	 * @param event - The event to get source maps for.
	 * @returns the source map list.
	 */
	private static _getEventMapContainers( event: MarkdownEvent ): ISourceMapContainer[] {
		return this._mapContainers.get( event ) ?? [];
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
	 */
	public registerMarkdownTag( tagName: Tag, paramsRegExp: RegExp | null, callback: MarkdownReplacer.ReplaceCallback ){
		const mdRegexBase = buildMarkdownRegExp( tagName, paramsRegExp );
		const tagRegex = new RegExp( `\\{${mdRegexBase.source}\\s*?\\}`, mdRegexBase.flags );
		this._currentPageMemo.initialize();
		this.plugin.application.renderer.on( MarkdownEvent.PARSE, this._processMarkdown.bind( this, tagRegex, ( { fullMatch, captures, event }, sourceHint ) => {
			const newFullMatch = fullMatch.slice( 2 ).slice( 0, -1 );
			return callback( { fullMatch: newFullMatch, captures, event }, sourceHint );
		}, tagName ), undefined, 100 );
	}


	/**
	 * Match every strings for {@link regex} & replace them with the return value of the {@link callback}. This method mutates the {@link event}.
	 *
	 * @param regex - The regex to match.
	 * @param callback - The callback to execute with fullMatch, captures, & a source hint.
	 * @param label - The replacer name.
	 * @param event - The event to modify.
	 */
	private _processMarkdown(
		regex: RegExp,
		callback: MarkdownReplacer.ReplaceCallback,
		label: string,
		event: MarkdownEvent,
	) {
		const mapContainers = MarkdownReplacer._getEventMapContainers( event );
		const originalText = event.parsedText;
		const getMapSource = last( mapContainers )?.getEditionContext ??
			( pos => ( { ...textUtils.getCoordinates( originalText, pos ), source: originalText, index: pos, expansions: [] } as IMapSource ) );

		const sourceFile = this._currentPageMemo.hasCurrent ? reflectionSourceUtils.getReflectionSourceFileName( this._currentPageMemo.currentReflection ) : undefined;
		const relativeSource = sourceFile ? this.plugin.relativeToRoot( sourceFile ) : undefined;
		const thisContainer: ISourceMapContainer = this._generateSourceMapContainer( regex, label, getMapSource );
		event.parsedText = originalText.replace(
			regex,
			( ...args ) => {
				const { captures, fullMatch, index } = spitArgs( ...args );
				const getSourceHint = () => {
					if( !relativeSource ){
						return 'UNKNOWN SOURCE';
					}
					const { line, column, expansions } = getMapSource( index );
					const posStr = line && column ? `:${line}:${column}` : '';
					const expansionContext = ` (in expansion of ${expansions.concat( [ thisContainer ] ).map( e => e.label ).join( ' ⇒ ' )})`;
					return relativeSource + posStr + expansionContext;
				};
				const replacement = miscUtils.catchWrap(
					() => callback( { fullMatch, captures, event }, getSourceHint ),
					() => `In ${getSourceHint()}` );
				if( isNil( replacement ) ){
					return fullMatch;
				}
				const replacementStr = typeof replacement === 'string' ? replacement : JSX.renderElement( replacement );
				thisContainer.editions.push( { from: index, to: index + fullMatch.length, replacement: replacementStr, source: fullMatch } );
				return replacementStr;
			} );
		MarkdownReplacer._mapContainers.set( event, [
			...mapContainers,
			thisContainer,
		] );
	}

	/**
	 * Create a new source map container for the given {@link regex} & {@link label}, that will chain with {@link getMapSource} to get location in the actual original source.
	 *
	 * @param regex - The regex used for replacement.
	 * @param label - The replacement label.
	 * @param getMapSource - The method to get the position before previous replacement.
	 * @returns a new map container.
	 */
	private _generateSourceMapContainer( regex: RegExp, label: string, getMapSource: ( pos: number ) => IMapSource ): ISourceMapContainer {
		const thisContainer: ISourceMapContainer = {
			regex,
			editions: [],
			label,
			plugin: this.plugin,
			getEditionContext: ( pos: number ) => {
				const { offsetedPos, didEdit } = thisContainer.editions.reduce(
					( acc, edit ) => {
						const isAfterEdit = edit.from <= acc.offsetedPos;
						if( !isAfterEdit ){
							return acc;
						}
						const _didEdit = edit.from + edit.replacement.length > acc.offsetedPos;
						return {
							offsetedPos: acc.offsetedPos + ( _didEdit ?
								edit.from - acc.offsetedPos :
								edit.source.length - edit.replacement.length ),
							didEdit: _didEdit || acc.didEdit,
						};
					},
					{ offsetedPos: pos, didEdit: false } );
				const source = getMapSource( offsetedPos );
				if( didEdit ){
					source.expansions = [ ...source.expansions, thisContainer ];
				}
				return source;
			},
		};
		return thisContainer;
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
}
