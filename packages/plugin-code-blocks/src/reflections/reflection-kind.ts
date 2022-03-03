import { ReflectionKind } from 'typedoc';

import { addReflectionKind } from '@knodes/typedoc-pluginutils';

// eslint-disable-next-line @typescript-eslint/no-var-requires -- Get name from package
const ns = require( '../../package.json' ).name;
/**
 * Extends the {@link ReflectionKind} to add custom Page, Menu & Any kinds.
 */
export enum ECodeBlockReflectionKind {
	CODE_BLOCK = addReflectionKind( ns, 'CodeBlock' ),
}
( ECodeBlockReflectionKind as unknown as ReflectionKind );
