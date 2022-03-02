import { copyFileSync } from 'fs';
import { extname, join } from 'path';

import { DefaultTheme, JSX, PageEvent, RendererEvent } from 'typedoc';

import type { CodeBlockPlugin } from '../plugin';
import { ICodeBlocksPluginThemeMethods } from '../theme';
import { EBlockMode, ICodeBlock } from '../types';

const CSS_FILE_NAME = 'assets/code-blocks.css';
export class DefaultCodeBlockRenderer implements ICodeBlocksPluginThemeMethods {
	public constructor( protected readonly theme: DefaultTheme, public readonly plugin: CodeBlockPlugin ){
		const { renderer } = theme.application;
		// Add stylesheet
		renderer.on( RendererEvent.END, this._onRenderEnd.bind( this ) );
		renderer.hooks.on( 'head.end', context => <link rel="stylesheet" href={context.relativeURL( CSS_FILE_NAME )} /> );
	}

	public readonly renderCodeBlock = ( { asFile, sourceFile, mode, content, url }: ICodeBlock ) => {
		const header = <p>
			From {url ? <a href={url}>{asFile}</a> : <>{asFile}</>}
		</p>;

		content = content.replace( /\\/g, '\\\\' ).replace( /`/g, '\\`' );
		content = `\`\`\`${extname( sourceFile ).slice( 1 )}
${content}
\`\`\``;
		const code = <JSX.Raw html={this.theme.getRenderContext( new PageEvent( asFile ) ).markdown( content )}></JSX.Raw>;

		switch( mode ){
			case EBlockMode.DEFAULT: {
				return <div class="code-block">
					{header}
					{code}
				</div>;
			}

			case EBlockMode.FOLDED:
			case EBlockMode.EXPANDED: {
				return <details class="code-block" open={mode === EBlockMode.EXPANDED}>
					<summary>{header}</summary>
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
