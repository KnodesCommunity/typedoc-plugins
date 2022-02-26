import assert from 'assert';

import { isNil, isNumber, isString, once } from 'lodash';
import MagicString from 'magic-string';
import { Context, Converter, JSX, MarkdownEvent, SourceFile } from 'typedoc';

import { ABasePlugin } from './base-plugin';
import { CurrentPageMemo } from './current-page-memo';
import { getCoordinates, getReflectionSourceFileName } from './utils';

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
	private static readonly _eventsOffsets = new WeakMap<MarkdownEvent, MagicString>();

	private readonly _logger = this.plugin.logger.makeChildLogger( 'MarkdownReplacer' );
	private readonly _currentPageMemo = new CurrentPageMemo( this.plugin );


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
	 */
	public bindReplace( regex: RegExp, callback: MarkdownReplacer.ReplaceCallback ) {
		assert( regex.flags.includes( 'g' ) );
		this.plugin.application.renderer.on( MarkdownEvent.PARSE, this._processMarkdown.bind( this, regex, callback ), undefined, 100 );
	}


	/**
	 * Match every strings for {@link regex} & replace them with the return value of the {@link callback}. This method mutates the {@link event}.
	 *
	 * @param regex - The regex to match.
	 * @param callback - The callback to execute with fullMatch, captures, & a source hint.
	 * @param event - The event to modify.
	 */
	private _processMarkdown(
		regex: RegExp,
		callback: MarkdownReplacer.ReplaceCallback,
		event: MarkdownEvent,
	) {
		let magic: MagicString | undefined = new MagicString( event.parsedText );
		event.parsedText = event.parsedText.replace(
			regex,
			( ...args ) => {
				const { captures, fullMatch, index, source } = spitArgs( ...args );
				const replacement = callback(
					{ fullMatch, captures },
					() => {
						const pos = getCoordinates( source, index );
						const { line, column } = pos;
						// const {line, column} = magic ? new SourceMapConsumer( magic.generateMap() ).originalPositionFor( { ...pos, bias: SourceMapConsumer.LEAST_UPPER_BOUND } ) : {};
						const posStr = line && column ? `:${line}:${column}` : '';
						const sourceFile = getReflectionSourceFileName( this._currentPageMemo.currentReflection );
						return sourceFile + posStr;
					} );
				if( isNil( replacement ) ){
					return fullMatch;
				}
				// console.log({index, before: source.slice(0, index)})
				const replacementStr = typeof replacement === 'string' ? replacement : JSX.renderElement( replacement );
				try {
					magic = magic?.overwrite( index, index + fullMatch.length, replacementStr );
				} catch( _e: any ){
					magic = undefined;
				}
				return replacementStr;
			} );
	}
}
export namespace MarkdownReplacer {
	export type ReplaceCallback = ( match: {fullMatch: string; captures: Array<string | null>}, sourceHint: () => string ) => string | JSX.Element | undefined;
}
