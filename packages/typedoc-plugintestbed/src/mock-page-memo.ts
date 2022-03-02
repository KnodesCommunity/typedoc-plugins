import assert from 'assert';

import { MarkdownEvent, PageEvent, ProjectReflection, Reflection, RenderTemplate, Renderer, SourceFile } from 'typedoc';

import { setupCaptureEvent } from './capture-event';

export const setupMockPageMemo = () => {
	const capture = setupCaptureEvent( Renderer, Renderer.EVENT_BEGIN_PAGE );
	return {
		captureEventRegistration: capture.captureEventRegistration,
		setCurrentPage: <T extends Reflection>( url: string, source: string, model: T, template: RenderTemplate<PageEvent<T>> = () => '', project = new ProjectReflection( 'Fake' ) ) => {
			const listeners = capture.getListeners();
			assert.equal( listeners.length, 1, `Invalid listeners count for event ${MarkdownEvent.PARSE}` );
			const event = new PageEvent<T>( PageEvent.BEGIN );
			event.project = project;
			event.url = url;
			event.model = model;
			event.template = template ?? ( () => '' );
			event.filename = url;
			Object.defineProperty( model, 'project', { value: project } );
			model.sources = [
				...( model.sources ?? [] ),
				{ fileName: source, character: 1, line: 1, file: new SourceFile( source ) },
			];
			listeners[0]( event );
		},
	};
};
