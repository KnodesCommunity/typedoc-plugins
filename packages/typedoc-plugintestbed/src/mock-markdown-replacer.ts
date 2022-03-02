import assert from 'assert';

import { MarkdownEvent, Renderer } from 'typedoc';

import { setupCaptureEvent } from './capture-event';

export const setupMockMarkdownReplacer = () => {
	const capture = setupCaptureEvent( Renderer, MarkdownEvent.PARSE );
	return {
		captureEventRegistration: capture.captureEventRegistration,
		runMarkdownReplace: ( text: string ) => {
			const listeners = capture.getListeners();
			assert.equal( listeners.length, 1, `Invalid listeners count for event ${MarkdownEvent.PARSE}` );
			const markdownEvent = new MarkdownEvent( MarkdownEvent.PARSE, text, text );
			listeners[0]( markdownEvent );
			return markdownEvent.parsedText;
		},
	};
};
