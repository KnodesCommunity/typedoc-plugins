import { ReflectionKind } from 'typedoc';

import { addReflectionKind } from '@knodes/typedoc-pluginutils';

// eslint-disable-next-line @typescript-eslint/no-var-requires -- Get name from package
const ns = require( '../../package.json' ).name;
/**
 * Extends the {@link ReflectionKind} to add custom Page, Menu & Any kinds.
 */
export enum PagesPluginReflectionKind {
	PAGE = addReflectionKind( ns, 'Page' ),
	MENU = addReflectionKind( ns, 'Menu' ),
	// eslint-disable-next-line no-bitwise -- expected.
	ANY =  addReflectionKind( ns, 'Any', PAGE | MENU ),
}
( PagesPluginReflectionKind as unknown as ReflectionKind );
