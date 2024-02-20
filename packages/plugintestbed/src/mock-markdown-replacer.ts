import assert from 'assert';

import { isNil } from 'lodash';
import { MarkdownEvent, PageEvent, Renderer } from 'typedoc';

import { setupCaptureEvent } from './capture-event';

export const setupMockMarkdownReplacer = () => {
	const capture = setupCaptureEvent( Renderer, MarkdownEvent.PARSE );
	return {
		captureEventRegistration: capture.captureEventRegistration,
		runMarkdownReplace: ( text: string, listenerIndex?: number ) => {
			const listeners = capture.getListeners();
			const markdownEvent = new MarkdownEvent( MarkdownEvent.PARSE, new PageEvent( 'test', {} ), text, text );
			assert( listeners.length >= 1, `Invalid listeners count for event ${MarkdownEvent.PARSE}` );
			const listenersToTrigger = isNil( listenerIndex ) ? listeners : [ listeners[listenerIndex] ];
			listenersToTrigger.forEach( l => l( markdownEvent ) );
			return markdownEvent.parsedText;
		},
	};
};
