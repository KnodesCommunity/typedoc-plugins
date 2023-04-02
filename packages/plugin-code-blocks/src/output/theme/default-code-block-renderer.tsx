import assert from 'assert';
import { copyFileSync } from 'fs';

import { DefaultTheme, JSX, PageEvent, RendererEvent } from 'typedoc';

import { IPluginComponent } from '@knodes/typedoc-pluginutils';
import { extname, join } from '@knodes/typedoc-pluginutils/path';

import type { CodeBlockPlugin } from '../../plugin';
import { EBlockMode, ICodeBlock, IInlineCodeBlock } from '../../types';
import { ICodeBlocksPluginThemeMethods } from './types';

const CSS_FILE_NAME = 'assets/code-blocks.css';
export class DefaultCodeBlockRenderer implements ICodeBlocksPluginThemeMethods, IPluginComponent<CodeBlockPlugin> {
	private readonly _theme: DefaultTheme;
	public constructor( public readonly plugin: CodeBlockPlugin ){
		const { renderer } = plugin.application;
		assert( renderer.theme instanceof DefaultTheme );
		this._theme = renderer.theme;
		// Add stylesheet
		renderer.on( RendererEvent.END, this._onRenderEnd.bind( this ) );
		renderer.hooks.on( 'head.end', context => <link rel="stylesheet" href={context.relativeURL( CSS_FILE_NAME )} /> );
	}

	public readonly renderInlineCodeBlock = ( { fileName, markdownCode, mode }: IInlineCodeBlock ) => this._wrapCode(
		<p>From {fileName}</p>,
		this._theme.getRenderContext( new PageEvent( fileName ) ).markdown( markdownCode ),
		mode,
	);

	public readonly renderCodeBlock = ( { asFile, sourceFile, mode, content, url }: ICodeBlock ) => this._wrapCode(
		<p>From {url ? <a href={url}>{asFile}</a> : <>{asFile}</>}</p>,
		this._theme.getRenderContext( new PageEvent( asFile ) ).markdown( this._generateFencedCodeBlock( sourceFile, content ) ),
		mode,
	);

	/**
	 * Generate a fenced code block with the extension of {@link sourceFile}. The {@link content} is searched for backticks, in order to be properly escaped.
	 *
	 * @param sourceFile - The source file name.
	 * @param content - The code content.
	 * @returns a markdown code block
	 */
	private _generateFencedCodeBlock( sourceFile: string, content: string ) {
		const ext = extname( sourceFile ).slice( 1 );
		const contentMaxTicks = Math.max( ...( content.match( /`{3,}/g ) ?? [ '' ] ).map( t => t.length ) );
		const blockTicks = Math.max( contentMaxTicks + 1, 3 );
		return `${'`'.repeat( blockTicks )}${ext}
${content}
${'`'.repeat( blockTicks )}`;
	}

	private readonly _wrapCode = ( header: string | JSX.Element, codeHighlighted: string, mode: EBlockMode ) => {
		const code = <>
			<JSX.Raw html={codeHighlighted}></JSX.Raw>
		</>;
		switch( mode ){
			case EBlockMode.DEFAULT: {
				return <div class="code-block">
					{header}
					{'\n'}
					{code}
				</div>;
			}

			case EBlockMode.FOLDED:
			case EBlockMode.EXPANDED: {
				return <details class="code-block" open={mode === EBlockMode.EXPANDED}>
					<summary>{header}</summary>
					{'\n'}
					{code}
				</details>;
			}

			default: {
				throw new Error( 'Invalid foldable marker' );
			}
		}
	};

	/**
	 * Copy assets to the output directory.
	 *
	 * @param event - The {@link RendererEvent.END} event.
	 */
	private _onRenderEnd( event: RendererEvent ) {
		const dest = join( event.outputDirectory, CSS_FILE_NAME );
		const src = this.plugin.resolvePackageFile( 'static/code-block.css' );
		copyFileSync( src, dest );
	}
}
