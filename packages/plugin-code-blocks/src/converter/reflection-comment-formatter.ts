import assert from 'assert';

import { without } from 'lodash';

import { IPluginComponent, ReflectionCommentReplacer } from '@knodes/typedoc-pluginutils';

import type { CodeBlockPlugin } from '../plugin';

class ReflectionCommentFormatter implements IPluginComponent<CodeBlockPlugin>{
	private readonly _reflectionCommentReplacer = new ReflectionCommentReplacer( this );
	public constructor( public readonly plugin: CodeBlockPlugin ){
		this._reflectionCommentReplacer.registerBlockTag( '@codeblock', this._onReplaceCodeBlockBlockTag.bind( this ) );
		this._reflectionCommentReplacer.registerInlineTag( '@codeblock' );
		this._reflectionCommentReplacer.registerBlockTag( '@inlineCodeblock', this._onReplaceInlineCodeBlockBlockTag.bind( this ) );
		this._reflectionCommentReplacer.registerInlineTag( '@inlineCodeblock' );
		this._reflectionCommentReplacer.registerBlockTag( '@example', this._onReplaceExampleBlockTag.bind( this ) );
	}

	/**
	 * Replace `@codeblock ...` with a properly formatted markdown
	 *
	 * @param match - The block match.
	 */
	private _onReplaceCodeBlockBlockTag( { comment, block }: ReflectionCommentReplacer.MatchBlock ){
		assert.equal( block.content[0].kind, 'text' );
		comment.blockTags = without( comment.blockTags, block );
		const [ main, ...other ] = block.content[0].text.split( '\n' ).map( s => s.trim() );
		comment.summary.push( { kind: 'text', text: '\n\n' }, { kind: 'inline-tag', tag: '@codeblock', text: main } );
		if( other.length > 0 ){
			comment.summary.push( { kind:'text', text: [ '', ...other ].join( '\n' ) } );
		}
		comment.summary.push( ...block.content.slice( 1 ) );
	}

	/**
	 * Replace `@inlineCodeblock ...` with a properly formatted markdown
	 *
	 * @param match - The block match.
	 */
	private _onReplaceInlineCodeBlockBlockTag( match: ReflectionCommentReplacer.MatchBlock ){
		const { comment, block } = match;
		assert( block.content.length >= 2 );
		assert.equal( block.content[0].kind, 'text' );
		assert.equal( block.content[1].kind, 'code' );
		const blockMeta = block.content[0].text;
		const blockCode = block.content[1].text;
		comment.blockTags = without( comment.blockTags, block );
		comment.summary.push( { kind: 'text', text: '\n\n' }, { kind: 'inline-tag', tag: '@inlineCodeblock', text: `${blockMeta} ${blockCode}` }, ...block.content.slice( 2 ) );
	}

	/**
	 * Replace `@example {@codeblock...} to be properly formatted.
	 *
	 * @param match - The block match.
	 */
	private _onReplaceExampleBlockTag( { block }: ReflectionCommentReplacer.MatchBlock ){
		if( block.content.length !== 1 || block.content[0].kind !== 'code' ){
			return;
		}
		const textSource = block.content[0].text;
		const codeBlockMatch = textSource.match( /^`{3}ts\n\{(@(?:inlineCodeblock|codeblock))(.*)\}\n`{3}$/s );
		if( !codeBlockMatch ){
			return;
		}
		block.content[0] = {
			kind: 'inline-tag',
			tag: codeBlockMatch[1] as `@${string}`,
			text: codeBlockMatch[2],
		};
	}
}
export const bindFormatReflectionComments = ( plugin: CodeBlockPlugin ) => new ReflectionCommentFormatter( plugin );
