import assert from 'assert';
import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { Application, Context, Converter, DeclarationReflection, ProjectReflection } from 'typedoc';

import { ApplicationAccessor, getApplication } from './base-plugin';
import { miscUtils } from './utils';

const tmpFile = ( prefix: string, ext: `.${string}`, content?: string ) => {
	const tempFile = join( tmpdir(), `${prefix}.${randomBytes( 6 ).readUIntLE( 0, 6 ).toString( 36 )}${ext}` );
	content = content ?? '';
	writeFileSync( tempFile, content, 'utf-8' );
	return tempFile;
};

export class MarkdownToSummary {
	private static readonly _apps = new WeakMap<Application, MarkdownToSummary>();

	private _context?: Context;

	/**
	 * Get markdown to summary for the given application.
	 *
	 * @param applicationAccessor - The application accessor to bind.
	 * @returns the events extra instance.
	 */
	public static for( applicationAccessor: ApplicationAccessor ){
		const application = getApplication( applicationAccessor );
		const e = this._apps.get( application ) ?? new MarkdownToSummary( application );
		this._apps.set( application, e );
		return e;
	}

	public constructor( private readonly _application: Application ){
		_application.converter.on( Converter.EVENT_BEGIN, this._memoizeContext.bind( this ) );
	}

	/**
	 * Generate comments from a string, by emulating a new project reflection.
	 * HACK - This method is mostly a hack and should be removed ASAP.
	 *
	 * @param str - The string to parse.
	 * @returns the parsed comment.
	 */
	public processFromString( str: string ){
		// TODO: Check if `renderer.package` can do the trick;

		assert( this._context, 'Should be constructed before "Converter.EVENT_BEGIN" is triggered' );
		const fakeProject = new ProjectReflection( 'STUB' );
		const fakeContext = new Context( this._context.converter, this._context.programs, fakeProject );
		fakeContext.setActiveProgram( this._context.programs[0] );

		const readmeFile = tmpFile( MarkdownToSummary.name, '.md', str );

		const converter = this._application.converter as any;
		// const converter: InstanceType<( typeof import( '../../../typedoc/src/lib/converter/converter' ).Converter )> = this._application.converter as any;
		const sourceFile = this._context.programs[0].getSourceFiles().find( src => src.fileName.startsWith( miscUtils.rootDir( this._application ) ) );
		assert( sourceFile );
		// eslint-disable-next-line @typescript-eslint/dot-notation -- Access private
		const ret: Context = converter['convertExports']( fakeContext as any, { program: fakeContext.program, displayName: 'TEMP', sourceFile, readmeFile }, false );
		assert( ret.scope instanceof DeclarationReflection );
		return ret.scope.readme;
	}

	/**
	 * Event callback executed once on {@link Converter.EVENT_BEGIN}.
	 * Memoize the converter context for later use.
	 *
	 * @param context - The converter context.
	 */
	private _memoizeContext( context: Context ){
		this._context = context;
	}
}
