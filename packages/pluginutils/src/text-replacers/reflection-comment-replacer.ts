import { Comment, CommentDisplayPart, CommentTag, Context, Converter, InlineTagDisplayPart, Reflection } from 'typedoc';

import { ABasePlugin, IPluginComponent, PluginAccessor, getPlugin } from '../base-plugin';
import { EventsExtra } from '../events-extra';
import { Tag } from './types';

const filterDisplayParts = ( tagName: Tag ) => ( commentPart: CommentDisplayPart ): commentPart is InlineTagDisplayPart => commentPart.kind === 'inline-tag' && commentPart.tag === tagName;

export class ReflectionCommentReplacer implements IPluginComponent {
	public readonly plugin: ABasePlugin;
	public constructor( pluginAccessor: PluginAccessor ){
		this.plugin = getPlugin( pluginAccessor );
	}

	/**
	 * Register an inline tag (`{@tag ...}`) and execute an optional function on found instances.
	 *
	 * @param tagName - The name of the tag to match.
	 * @param callback - An optional callback to execute on found tags.
	 * @param priority - The priority to run the callback if provided.
	 */
	public registerInlineTag(
		tagName: Tag,
		callback?: ReflectionCommentReplacer.ReplaceCallback<ReflectionCommentReplacer.MatchBlockComment | ReflectionCommentReplacer.MatchSummary>,
		priority?: number,
	){
		EventsExtra.for( this.plugin.application )
			.beforeOptionsFreeze( () => {
				this.plugin.application.options.getValue( 'inlineTags' ).push( tagName );
			} );
		if( callback ){
			this.plugin.application.converter.on( Converter.EVENT_RESOLVE, ( context: Context, reflection: Reflection ) => {
				const comment = reflection.comment;
				if( !comment ){
					return;
				}
				const filter = filterDisplayParts( tagName );
				comment.summary.forEach( ( t, i ) => {
					if( filter( t ) ){
						callback( { comment, kind: 'summary', tag: t, context, reflection, replace: v => comment.summary[i] = v } );
					}
				} );
				comment.blockTags.forEach( b => b.content.forEach( ( t, i ) => {
					if( filter( t ) ){
						callback( { comment, kind: 'blockComment', tag: t, block: b, context, reflection, replace: v => b.content[i] = v } );
					}
				} ) );
			}, null, priority );
		}
	}

	/**
	 * Register a block tag (`\n@tag ...\n`) and execute an optional function on found instances.
	 *
	 * @param tagName - The name of the tag to match.
	 * @param callback - An optional callback to execute on found tags.
	 * @param priority - The priority to run the callback if provided.
	 */
	public registerBlockTag( tagName: Tag, callback?: ReflectionCommentReplacer.ReplaceCallback<ReflectionCommentReplacer.MatchBlock>, priority?: number ){
		EventsExtra.for( this.plugin.application )
			.beforeOptionsFreeze( () => {
				this.plugin.application.options.getValue( 'blockTags' ).push( tagName );
			} );
		if( callback ){
			this.plugin.application.converter.on( Converter.EVENT_RESOLVE, ( context: Context, reflection: Reflection ) => {
				const comment = reflection.comment;
				if( !comment ){
					return;
				}
				comment.blockTags.forEach( ( b, i ) => {
					if( b.tag === tagName ){
						callback( { comment, kind: 'block', block: b, context, reflection, replace: v => comment.blockTags[i] = v } );
					}
				} );
			}, null, priority );
		}
	}
}
export namespace ReflectionCommentReplacer {
	export type SourceHint = () => string;
	export type TagKind = 'summary' | 'block' | 'blockComment';
	export interface MatchBase {
		comment: Comment;
		kind: TagKind;
		reflection: Reflection;
		context: Context;
	}
	export interface MatchBlockComment extends MatchBase {
		kind: 'blockComment';
		tag: InlineTagDisplayPart;
		block: CommentTag;
		replace: ( newVal: CommentDisplayPart ) => void;
	}
	export interface MatchBlock extends MatchBase {
		kind: 'block';
		block: CommentTag;
		replace: ( newVal: CommentTag ) => void;
	}
	export interface MatchSummary extends MatchBase {
		kind: 'summary';
		tag: InlineTagDisplayPart;
		replace: ( newVal: CommentDisplayPart ) => void;
	}
	export type Match = MatchBlockComment | MatchBlock | MatchSummary
	export type ReplaceCallback<T extends Match> = ( match: T ) => void;
}
