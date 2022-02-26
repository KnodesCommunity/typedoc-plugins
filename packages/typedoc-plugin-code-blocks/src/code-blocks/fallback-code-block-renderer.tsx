import { copyFileSync } from 'fs';
import { extname, join, resolve } from 'path';

import { DefaultTheme, JSX, PageEvent, RendererEvent } from 'typedoc';

import type { CodeBlockPlugin } from '../plugin';
import { ICodeBlock, ICodeBlocksPluginThemeMethods } from '../theme';

const CSS_FILE_NAME = 'assets/code-blocks.css';
export class FallbackCodeBlockRenderer implements ICodeBlocksPluginThemeMethods {
	public constructor( protected readonly theme: DefaultTheme, themeName: string, public readonly plugin: CodeBlockPlugin ){
		plugin.logger.warn( `The current theme "${themeName}" is not compatible with the plugin. Using fallback code blocks renderer compatible with default theme.` );
		const { renderer } = theme.application;
		renderer.hooks.on( 'head.end', context => <link rel="stylesheet" href={context.relativeURL( CSS_FILE_NAME )} /> );
		renderer.on( RendererEvent.END, this._onRenderEnd.bind( this ) );
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
			case null: {
				return <div class="code-block">
					{header}
					{code}
				</div>;
			}

			case 'folded':
			case 'foldable': {
				return <details class="code-block" open={mode === 'foldable'}>
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
	 * @param event
	 */
	private _onRenderEnd( event: RendererEvent ) {
		const dest = join( event.outputDirectory, CSS_FILE_NAME );
		const src = resolve( __dirname, '../../static/code-block.css' );
		copyFileSync( src, dest );
	}
}
