import assert from 'assert';

import { isNil } from 'lodash';
import { PageEvent, ProjectReflection, Reflection, RenderTemplate, Renderer, SourceFile } from 'typedoc';

import { setupCaptureEvent } from './capture-event';

export const setupMockPageMemo = () => {
	const capture = setupCaptureEvent( Renderer, Renderer.EVENT_BEGIN_PAGE );
	return {
		captureEventRegistration: capture.captureEventRegistration,
		setCurrentPage: <T extends Reflection>(
			url: string,
			source: string,
			model: T,
			template: RenderTemplate<PageEvent<T>> = () => '',
			project = new ProjectReflection( 'Fake' ),
			listenerIndex?: number,
		) => {
			const listeners = capture.getListeners();
			assert( listeners.length >= 1, `Invalid listeners count for event ${Renderer.EVENT_BEGIN_PAGE}` );
			const pageEvent = new PageEvent<T>( PageEvent.BEGIN );
			pageEvent.project = project;
			pageEvent.url = url;
			pageEvent.model = model;
			pageEvent.template = template ?? ( () => '' );
			pageEvent.filename = url;
			Object.defineProperty( model, 'project', { value: project } );
			model.sources = [
				...( model.sources ?? [] ),
				{ fileName: source, character: 1, line: 1, file: new SourceFile( source ) },
			];
			const listenersToTrigger = isNil( listenerIndex ) ? listeners : [ listeners[listenerIndex] ];
			listenersToTrigger.forEach( l => l( pageEvent ) );
		},
	};
};
