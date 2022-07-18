import assert from 'assert';

import { isNil } from 'lodash';

import { PageEvent, Reflection } from 'typedoc';

import { ABasePlugin, IPluginComponent, PluginAccessor, getPlugin } from './base-plugin';

export class CurrentPageMemo implements IPluginComponent {
	private static readonly _plugins = new WeakMap<ABasePlugin, CurrentPageMemo>();
	private _currentPage?: PageEvent<Reflection>;
	private _initialized = false;
	public get initialized(){
		return this._initialized;
	}

	/**
	 * Get the instance for the given plugin.
	 *
	 * @param pluginAccessor - The plugin accessor to get memo for.
	 * @returns the plugin page memo
	 */
	public static for( pluginAccessor: PluginAccessor ){
		const plugin = getPlugin( pluginAccessor );
		const e = this._plugins.get( plugin ) ?? new CurrentPageMemo( plugin );
		this._plugins.set( plugin, e );
		return e;
	}

	private constructor( public readonly plugin: ABasePlugin ){}

	/**
	 * Start watching for pages event.
	 */
	public initialize(){
		if( this._initialized ){
			return;
		}
		this._initialized = true;
		this.plugin.application.renderer.on( PageEvent.BEGIN, ( e: PageEvent<Reflection> ) => this._currentPage = e );
		this.plugin.application.renderer.on( PageEvent.END, () => this._currentPage = undefined );
	}

	/**
	 * Set the current page as being the {@link newPage} while running the {@link callback}. The current page is restored afterwards no matter what.
	 *
	 * @param newPage - The page to set.
	 * @param callback - The function to execute.
	 * @returns the {@link callback} return value.
	 */
	public fakeWrapPage<T>( newPage: PageEvent<Reflection>, callback: () => T ): T
	public fakeWrapPage<T>( name: string, model: Reflection, callback: () => T ): T
	public fakeWrapPage<T>( ...args: [newPage: PageEvent<Reflection>, callback: () => T] | [name: string, model: Reflection, callback: () => T] ){
		let newPage: PageEvent<Reflection>;
		if( args.length === 3 ){
			newPage = new PageEvent( args[0] );
			newPage.model = args[1];
		} else {
			newPage = args[0];
		}
		const callback = args[args.length - 1] as () => T;
		const bck = this._currentPage;
		this._currentPage = newPage;
		try {
			return callback();
		} finally {
			this._currentPage = bck;
		}
	}

	public get currentPage(): PageEvent<Reflection> {
		assert( this._currentPage );
		assert( this._currentPage.model instanceof Reflection );
		return this._currentPage;
	}

	public get currentReflection(): Reflection {
		return this.currentPage.model;
	}

	public get hasCurrent(): boolean {
		return !isNil( this._currentPage );
	}
}
