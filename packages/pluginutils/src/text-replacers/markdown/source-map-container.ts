import { last } from 'lodash';

import { SourceMapLayer } from './source-map-layer';

export class SourceMapContainer {
	private readonly _layers: SourceMapLayer[] = [];

	/**
	 * Create a new layer added to this container.
	 *
	 * @param label - The layer's label.
	 * @param originalText - The original text.
	 * @returns the new layer.
	 */
	public addLayer( label: string, originalText: string ) {
		const parentLayer = last( this._layers );
		const newLayer = new SourceMapLayer( label, originalText, parentLayer );
		this._layers.push( newLayer );
		return newLayer;
	}
}
