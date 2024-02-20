import assert from 'assert';

import { isNil } from 'lodash';
import { PageEvent, Reflection, Renderer } from 'typedoc';

import { setupCaptureEvent } from './capture-event';

export const setupMockPageMemo = () => {
	const capture = setupCaptureEvent( Renderer, PageEvent.BEGIN );
	return {
		captureEventRegistration: capture.captureEventRegistration,
		setCurrentPage: <T extends Reflection>(
			url: string,
			model: T,
			listenerIndex?: number,
		) => {
			const listeners = capture.getListeners();
			assert( listeners.length >= 1, `Invalid listeners count for event ${PageEvent.BEGIN}` );
			const pageEvent = new PageEvent<T>( PageEvent.BEGIN, model );
			pageEvent.project = model.project;
			pageEvent.url = url;
			pageEvent.filename = url;
			const listenersToTrigger = isNil( listenerIndex ) ? listeners : [ listeners[listenerIndex] ];
			listenersToTrigger.forEach( l => l( pageEvent ) );
		},
	};
};
