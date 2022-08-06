import { DefaultTheme, DefaultThemeRenderContext } from 'typedoc';

import { MockPlugin, mockPlugin } from '#plugintestbed';

import { CodeBlockPlugin } from '../../plugin';
import { EBlockMode } from '../../types';
import { DefaultCodeBlockRenderer } from './default-code-block-renderer';

let plugin: MockPlugin<CodeBlockPlugin>;
let codeBlockRenderer: DefaultCodeBlockRenderer;
beforeEach( () => {
	plugin = mockPlugin<CodeBlockPlugin>();
	plugin.application.renderer.theme = new DefaultTheme( plugin.application.renderer ) as any;
	codeBlockRenderer = new DefaultCodeBlockRenderer( plugin );
} );
describe( 'Content escaping', () => {
	let mockRenderContext: jest.MaybeMockedDeep<DefaultThemeRenderContext>;
	beforeEach( () => {
		mockRenderContext = {
			markdown: jest.fn(),
		} as any;
		jest.spyOn( plugin.application.renderer.theme as jest.MockedObjectDeep<DefaultTheme>, 'getRenderContext' ).mockReturnValue( mockRenderContext );
	} );
	it.each( [
		[ 'Hello', 'test.md', '```md\nHello\n```' ],
		[ '`Hello`', 'test.md', '```md\n`Hello`\n```' ],
		[ '``Hello', 'test.md', '```md\n``Hello\n```' ],
		[ '``Hello```', 'test.md', '````md\n``Hello```\n````' ],
		[ 'Hello`````', 'test.md', '``````md\nHello`````\n``````' ],
	] )( 'should print correctly content %s', ( content, file, expected ) => {
		codeBlockRenderer.renderCodeBlock( { asFile: file, sourceFile: file, content, mode: EBlockMode.DEFAULT } );
		expect( mockRenderContext.markdown ).toHaveBeenCalledTimes( 1 );
		expect( mockRenderContext.markdown ).toHaveBeenCalledWith( expected );
	} );
} );
