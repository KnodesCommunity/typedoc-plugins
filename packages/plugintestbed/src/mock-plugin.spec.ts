import { getPlugin } from '@knodes/typedoc-pluginutils';

import { mockPlugin } from './mock-plugin';

describe( 'mockPlugin', () => {
	it( 'should pass the `getPlugin` plugin accessor helper', () => {
		const plugin = mockPlugin();
		expect( getPlugin( plugin ) ).toBe( plugin );
	} );
} );
