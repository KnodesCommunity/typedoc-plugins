import { Application, MarkdownEvent } from 'typedoc';

import { CodeBlockPlugin } from './code-block-plugin';

export const load = ( app: Application ) => {
	const plugin = new CodeBlockPlugin( app );
	app.renderer.on( MarkdownEvent.PARSE, plugin.processMarkdown.bind( plugin ) );
};
