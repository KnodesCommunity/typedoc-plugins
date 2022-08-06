import { Application, Comment, CommentTag, Context, Converter, DeclarationReflection, ReflectionKind } from 'typedoc';

import { createMockProjectWithPackage, setupCaptureEvent } from '#plugintestbed';

import { ABasePlugin } from '../../base-plugin';
import { ReflectionCommentReplacer } from './reflection-comment-replacer';

let plugin: ABasePlugin;
let replacer: ReflectionCommentReplacer;
const eventResolveCapture = setupCaptureEvent( Converter, Converter.EVENT_RESOLVE );
beforeEach( () => {
	eventResolveCapture.captureEventRegistration();
	const application = new Application();
	plugin = new ( class Plug extends ABasePlugin{
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		public initialize(): void {}
	} )( application, __dirname );
	replacer = new ReflectionCommentReplacer( plugin as any );
} );

const SUMMARY = { kind: 'inline-tag', tag: '@foo', text: 'Foo' } as const;
const BLOCK_SUMMARY = { kind: 'inline-tag', tag: '@baz', text: 'Baz' } as const;
const BLOCK = new CommentTag(
	'@bar',
	[ { kind: 'text', text: '' }, BLOCK_SUMMARY, { kind: 'code', text: '' } ] );
const makeComment = () => new Comment(
	[ { kind: 'text', text: '' }, SUMMARY, { kind: 'code', text: '' } ],
	[ BLOCK ],
	new Set( [ '@baaz' ] ) );
const makeReflection = () => {
	const ref = new DeclarationReflection( 'example', ReflectionKind.Accessor );
	ref.comment = makeComment();
	return ref;
};
const makeContext = () => new Context( plugin.application.converter, [], createMockProjectWithPackage() );

it( 'should not listen by default', () => {
	expect( eventResolveCapture.getListeners() ).toHaveLength( 0 );
} );
describe( 'Inline tag', () => {
	it( 'should match summary tags', () => {
		const replaceFn = jest.fn().mockImplementation( ( { replace } ) => replace( 'REP' ) );
		replacer.registerInlineTag( '@foo', replaceFn );
		expect( eventResolveCapture.getListeners() ).toHaveLength( 1 );
		const reflection = makeReflection();
		const context = makeContext();
		eventResolveCapture.getListeners()[0]( context, reflection );
		expect( replaceFn ).toHaveBeenCalledTimes( 1 );
		expect( replaceFn ).toHaveBeenCalledWith( {
			context,
			reflection,
			tag: SUMMARY,
			comment: reflection.comment,
			kind: 'summary',
			replace: expect.any( Function ),
		} );
		expect( reflection.comment!.summary[1] ).toEqual( 'REP' );
	} );
	it( 'should match block comment tags', () => {
		const replaceFn = jest.fn().mockImplementation( ( { replace } ) => replace( 'REP' ) );
		replacer.registerInlineTag( '@baz', replaceFn );
		expect( eventResolveCapture.getListeners() ).toHaveLength( 1 );
		const reflection = makeReflection();
		const context = makeContext();
		eventResolveCapture.getListeners()[0]( context, reflection );
		expect( replaceFn ).toHaveBeenCalledTimes( 1 );
		expect( replaceFn ).toHaveBeenCalledWith( {
			context,
			reflection,
			tag: BLOCK_SUMMARY,
			block: BLOCK,
			comment: reflection.comment,
			kind: 'blockComment',
			replace: expect.any( Function ),
		} );
		expect( reflection.comment!.blockTags[0].content[1] ).toEqual( 'REP' );
	} );
} );
describe( 'Block tag', () => {
	it( 'should match block tags', () => {
		const replaceFn = jest.fn().mockImplementation( ( { replace } ) => replace( 'REP' ) );
		replacer.registerBlockTag( '@bar', replaceFn );
		expect( eventResolveCapture.getListeners() ).toHaveLength( 1 );
		const reflection = makeReflection();
		const context = makeContext();
		eventResolveCapture.getListeners()[0]( context, reflection );
		expect( replaceFn ).toHaveBeenCalledTimes( 1 );
		expect( replaceFn ).toHaveBeenCalledWith( {
			context,
			reflection,
			block: BLOCK,
			comment: reflection.comment,
			kind: 'block',
			replace: expect.any( Function ),
		} );
		expect( reflection.comment!.blockTags[0] ).toEqual( 'REP' );
	} );
} );
