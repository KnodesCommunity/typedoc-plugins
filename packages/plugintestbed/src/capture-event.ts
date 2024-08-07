import { isFunction, isString } from 'lodash';
import { Class } from 'type-fest';
import { EventCallback, EventDispatcher, EventMap } from 'typedoc';

const __isCapture = Symbol.for( '__isCapture' );
export const setupCaptureEvent = <T extends EventDispatcher>( cls: Class<T>, eventName: string ) => {
	let listenerToTest: CallableFunction[] = [];
	let baseOn: EventDispatcher['on'];
	function registerEvent( eventMap: EventMap ): T;
	function registerEvent( eventMap: EventMap, callback?: EventCallback ): T;
	function registerEvent( name: string, callback: EventCallback ): T;
	function registerEvent(
		this: T,
		nameOrMap: EventMap | string,
		callback?: EventCallback,
	){
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- By signature, `callback` always exists.
		const objEvent = isString( nameOrMap ) ? { [nameOrMap]: callback! } : nameOrMap;
		const handlers = [ objEvent[eventName], objEvent.all ].filter( isFunction );
		listenerToTest.push( ...handlers );
		if( ( baseOn as any )[__isCapture] ){
			// eslint-disable-next-line prefer-rest-params -- Pass all args
			return baseOn.apply( this, arguments as any );
		}
		return this;
	}
	( registerEvent as any )[__isCapture] = true;
	afterEach( () => {
		if( baseOn && !( baseOn as any )[__isCapture] ){
			cls.prototype.on = baseOn as any;
		}
		listenerToTest = [];
	} );
	return {
		captureEventRegistration: () => {
			baseOn = cls.prototype.on;
			cls.prototype.on = registerEvent;
		},
		getListeners: () => listenerToTest,
	};
};
