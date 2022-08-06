import { textUtils } from '../../utils';

interface ISourceEdit {
	from: number;
	source: string;
	replacement: string;
}

export interface ISourceMap {
	line: number;
	column: number;
	layers: SourceMapLayer[];
	pos: number;
}

export class SourceMapLayer {
	public readonly editions: ISourceEdit[] = [];
	private _resultingText = this.originalText;
	public get resultingText(){
		return this._resultingText;
	}
	public constructor(
		public readonly label: string,
		public readonly originalText: string,
		private readonly _parentLayer?: SourceMapLayer,
	){}

	/**
	 * Add a new edition to this layer.
	 *
	 * @param from - The position where the edit starts.
	 * @param source - The original content.
	 * @param replacement - The replacement content.
	 */
	public addEdition( from: number, source: string, replacement: string ){
		const edition = { from, replacement, source };
		const deltaPos = this._remapSelfEditPos( from ).delta;
		this.editions.push( edition );
		this._resultingText = this._resultingText.slice( 0, from + deltaPos ) + replacement + this._resultingText.slice( from + source.length + deltaPos );
	}

	/**
	 * Return a string describing the position of the given index in the source file.
	 *
	 * @param sourceFile - The source file name.
	 * @param index - The char index.
	 * @returns a string like `"hello.ts:42:84" (in expansion of @tag1 ⇒ @tag2)"
	 */
	public sourceHint( sourceFile: string | undefined, index: number ){
		if( !sourceFile ){
			return 'UNKNOWN SOURCE';
		}
		const { line, column, layers: expansions } = this._getSourceMap( index, false );
		const posStr = line && column ? `:${line}:${column}` : '';
		const expansionContext = ` (in expansion of ${expansions.map( e => e.label ).join( ' ⇒ ' )})`;
		return `"${sourceFile}${posStr}"${expansionContext}`;
	}

	/**
	 * Map the given {@link pos} in the 1st layer's content.
	 *
	 * @param pos - The character index.
	 * @param mapSelf - A flag indicating if this layer's editions should be mapped.
	 * @returns the source map.
	 */
	private _getSourceMap( pos: number, mapSelf = true ){
		const { offsetedPos, isExpansionApplied } = mapSelf ? this._remapSelfEditPos( pos ) : { offsetedPos: pos, isExpansionApplied: true };
		const editionContext: ISourceMap = this._parentLayer?._getSourceMap( offsetedPos ) ?? {
			...textUtils.getCoordinates( this.originalText, offsetedPos ),
			pos: offsetedPos,
			layers: [],
		};
		if( isExpansionApplied ){
			editionContext.layers = [ ...editionContext.layers, this ];
		}
		return editionContext;
	}

	/**
	 * Remap the given position in this layer's editions.
	 *
	 * @param pos - The character position.
	 * @returns the mapped position.
	 */
	private _remapSelfEditPos( pos: number ) {
		const remap = this.editions.reduce(
			( acc, edit ) => {
				const isAfterEdit = edit.from <= acc.offsetedPos;
				if( !isAfterEdit ){
					return acc;
				}
				const _isExpansionApplied = edit.from + edit.replacement.length > acc.offsetedPos;
				const isOffsettedPosInEdit = edit.from <= acc.offsetedPos && edit.from + edit.replacement.length >= acc.offsetedPos;
				const newAcc = {
					offsetedPos: isOffsettedPosInEdit ?
						edit.from :
						acc.offsetedPos - ( edit.replacement.length - edit.source.length ),
					isExpansionApplied: _isExpansionApplied || acc.isExpansionApplied,
				};
				return newAcc;
			},
			{ offsetedPos: pos, isExpansionApplied: false } );
		return {
			...remap,
			delta: remap.offsetedPos - pos,
		};
	}
}
