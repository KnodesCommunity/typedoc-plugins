import assert from 'assert';

import { isNil } from 'lodash';
import { PageEvent, Reflection, RenderTemplate, Renderer, SourceReference } from 'typedoc';

import { setupCaptureEvent } from './capture-event';

export const setupMockPageMemo = () => {
	const capture = setupCaptureEvent( Renderer, PageEvent.BEGIN );
	return {
		captureEventRegistration: capture.captureEventRegistration,
		setCurrentPage: <T extends Reflection>(
			url: string,
			source: string,
			model: T,
			template: RenderTemplate<PageEvent<T>> = () => '',
			listenerIndex?: number,
		) => {
			const listeners = capture.getListeners();
			assert( listeners.length >= 1, `Invalid listeners count for event ${PageEvent.BEGIN}` );
			const pageEvent = new PageEvent<T>( PageEvent.BEGIN );
			pageEvent.project = model.project;
			pageEvent.url = url;
			pageEvent.model = model;
			pageEvent.template = template ?? ( () => '' );
			pageEvent.filename = url;
			model.sources = [
				...( model.sources ?? [] ),
				new SourceReference( source, 1, 1 ),
			];
			const listenersToTrigger = isNil( listenerIndex ) ? listeners : [ listeners[listenerIndex] ];
			listenersToTrigger.forEach( l => l( pageEvent ) );
		},
	};
};
