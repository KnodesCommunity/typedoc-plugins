import assert from 'assert';
import { copyFileSync } from 'fs';
import { extname, join } from 'path';

import { DefaultTheme, JSX, PageEvent, RendererEvent } from 'typedoc';

import { IPluginComponent } from '@knodes/typedoc-pluginutils';

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
		this._theme.getRenderContext( new PageEvent( asFile ) ).markdown( `\`\`\`${extname( sourceFile ).slice( 1 )}
${content.replace( /\\/g, '\\\\' ).replace( /`/g, '\\`' )}
\`\`\`` ),
		mode,
	);

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
