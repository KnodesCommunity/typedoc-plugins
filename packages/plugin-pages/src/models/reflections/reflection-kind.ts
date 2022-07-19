import { ReflectionKind } from 'typedoc';

import { reflectionKindUtils } from '@knodes/typedoc-pluginutils';
const { addReflectionKind } = reflectionKindUtils;

// eslint-disable-next-line @typescript-eslint/no-var-requires -- Get name from package
const ns = require( '../../../package.json' ).name;
/**
 * Extends the {@link ReflectionKind} to add custom Page, Menu & Any kinds.
 */
export enum PagesPluginReflectionKind {
	ROOT = addReflectionKind( ns, 'Root' ),
	PAGE = addReflectionKind( ns, 'Page' ),
	MENU = addReflectionKind( ns, 'Menu' ),
	ANY =  addReflectionKind( ns, 'Any', PAGE | MENU ),
}
addReflectionKind( ns, 'Root page', PagesPluginReflectionKind.ROOT | PagesPluginReflectionKind.PAGE );
addReflectionKind( ns, 'Root menu', PagesPluginReflectionKind.ROOT | PagesPluginReflectionKind.MENU );
( PagesPluginReflectionKind as unknown as ReflectionKind );

