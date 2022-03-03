import assert from 'assert';

import { isNil, isNumber, isString, last, once } from 'lodash';
import { Context, Converter, JSX, MarkdownEvent, SourceFile } from 'typedoc';

import { ABasePlugin } from './base-plugin';
import { CurrentPageMemo } from './current-page-memo';
import { reflectionSourceUtils, textUtils } from './utils';

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
const spitArgs = ( ...args: Parameters<Parameters<typeof String.prototype.replace>[1]> ) => {
	const indexIdx = args.findIndex( isNumber );
	if( isNil( indexIdx ) ){
		throw new Error();
	}
	return {
		fullMatch: args[0] as string,
		captures: args.slice( 1, indexIdx ) as Array<string | null>,
		index: args[indexIdx] as number,
		source: args[indexIdx + 1] as string,
	};
};
export class MarkdownReplacer {
	private static readonly _addSourceToProject = once( function( this: MarkdownReplacer, context: Context ){
		const packagePlugin: undefined | Partial<Readonly<{readmeFile: string; packageFile: string}>>  = context.converter.getComponent( 'package' ) as any;
		const errMsg = 'It is used to complete README & package sources for better tracking of markdown issues.';
		if( !packagePlugin ){
			this._logger.warn( `Missing \`package\` plugin. ${errMsg}` );
			return;
		}
		if( !( 'readmeFile' in packagePlugin && isString( packagePlugin.readmeFile ) ) ){
			this._logger.warn( `Missing \`readmeFile\` in \`package\` plugin. ${errMsg}` );
			return;
		}
		context.project.sources = [
			...( context.project.sources ?? [] ),
			{
				fileName: packagePlugin.readmeFile,
				character: 1,
				line: 1,
				file: new SourceFile( packagePlugin.readmeFile ),
			},
		];
		if( 'packageFile' in packagePlugin && isString( packagePlugin.packageFile ) ){
			context.project.sources = [
				...context.project.sources,
				{
					fileName: packagePlugin.packageFile,
					character: 1,
					line: 1,
					file: new SourceFile( packagePlugin.packageFile ),
				},
			];
		}
	} );
	private static readonly _mapContainers = new WeakMap<MarkdownEvent, ISourceMapContainer[]>();

	private readonly _logger = this.plugin.logger.makeChildLogger( 'MarkdownReplacer' );
	private readonly _currentPageMemo = new CurrentPageMemo( this.plugin );

	/**
	 * Get the list of source map containers for the given event.
	 *
	 * @param event - The event to get source maps for.
	 * @returns the source map list.
	 */
	private static _getEventMapContainers( event: MarkdownEvent ): ISourceMapContainer[] {
		return this._mapContainers.get( event ) ?? [];
	}

	public constructor(
		protected readonly plugin: ABasePlugin,
	){
		this.plugin.application.converter.on( Converter.EVENT_RESOLVE_BEGIN, MarkdownReplacer._addSourceToProject.bind( this ) );
	}

	/**
	 * Bind {@link MarkdownEvent} to replace every occurences of the {@link regex} with the {@link callback} result.
	 *
	 * @param regex - The regex to match.
	 * @param callback - The callback to execute with fullMatch, captures, & a source hint.
	 * @param label - The replacer name.
	 */
	public bindReplace( regex: RegExp, callback: MarkdownReplacer.ReplaceCallback, label = `${this.plugin.name}: Unnamed markdown replace` ) {
		assert( regex.flags.includes( 'g' ) );
		this._currentPageMemo.initialize();
		this.plugin.application.renderer.on( MarkdownEvent.PARSE, this._processMarkdown.bind( this, regex, callback, label ), undefined, 100 );
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
		const sourceFile = this._currentPageMemo.hasCurrent ? reflectionSourceUtils.getReflectionSourceFileName( this._currentPageMemo.currentReflection ) : undefined;
		const relativeSource = sourceFile ? this.plugin.relativeToRoot( sourceFile ) : undefined;
		const originalText = event.parsedText;
		const getCtxInParent = last( mapContainers )?.getEditionContext ??
			( pos => ( { ...textUtils.getCoordinates( originalText, pos ), source: originalText, index: pos, expansions: [] } ) );
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
				const parentCtx = getCtxInParent( offsetedPos );
				if( didEdit ){
					parentCtx.expansions = [ ...parentCtx.expansions, thisContainer ];
				}
				return parentCtx;
			},
		};
		event.parsedText = originalText.replace(
			regex,
			( ...args ) => {
				const { captures, fullMatch, index } = spitArgs( ...args );
				const getSourceHint = () => {
					if( !relativeSource ){
						return 'UNKNOWN SOURCE';
					}
					const { line, column, expansions } = getCtxInParent( index );
					const posStr = line && column ? `:${line}:${column}` : '';
					const expansionContext = ` (in expansion of ${expansions.concat( [ thisContainer ] ).map( e => e.label ).join( ' ⇒ ' )})`;
					return relativeSource + posStr + expansionContext;
				};
				try {
					const replacement = callback( { fullMatch, captures }, getSourceHint );
					if( isNil( replacement ) ){
						return fullMatch;
					}
					const replacementStr = typeof replacement === 'string' ? replacement : JSX.renderElement( replacement );
					thisContainer.editions.push( { from: index, to: index + fullMatch.length, replacement: replacementStr, source: fullMatch } );
					return replacementStr;
				} catch( e ){
					throw new Error( `Error in ${getSourceHint()}:\n${e}` );
				}
			} );
		MarkdownReplacer._mapContainers.set( event, [
			...mapContainers,
			thisContainer,
		] );
	}
}
export namespace MarkdownReplacer {
	export type ReplaceCallback = ( match: {fullMatch: string; captures: Array<string | null>}, sourceHint: () => string ) => string | JSX.Element | undefined;
}
