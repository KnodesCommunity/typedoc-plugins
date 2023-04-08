import { resolve } from 'path';
import { fileURLToPath } from 'url';

import { normalizePath } from 'typedoc';

import { changelog } from './sync-proto-modules/changelog.mjs';
import { circleCi } from './sync-proto-modules/circleci.mjs';
import { issueTemplate } from './sync-proto-modules/issue-template.mjs';
import { packageJson } from './sync-proto-modules/package-json.mjs';
import { readme } from './sync-proto-modules/readme.mjs';
import { syncFs } from './sync-proto-modules/sync-fs.mjs';
import { typedocSubmodule } from './sync-proto-modules/typedoc-submodule.mjs';
import { summarizeErrors } from './sync-proto-modules/utils/index.mjs';
import { createStash, selectProjects } from './utils.js';

const { explicitProjects, stash, checkOnly } = process.argv.slice( 2 )
	.reduce( ( acc, arg ) => {
		if( arg === '--no-stash' ){
			return { ...acc, stash: false };
		} else if( arg === '--check' ){
			return { ...acc, checkOnly: true, stash: false };
		} else if( arg.startsWith( '-' ) ){
			throw new Error( `Unknown arg ${arg}` );
		} else {
			return { ...acc, explicitProjects: [ ...acc.explicitProjects, arg ] };
		}
	}, { explicitProjects: [], stash: true, checkOnly: false } );
const projects = selectProjects( explicitProjects );
const protoDir = normalizePath( resolve( fileURLToPath( new URL( '.', import.meta.url ) ), 'proto' ) );

try {
	if( stash ){
		await createStash( `Sync packages ${projects.map( p => p.name ).join( ' ' )}` );
	}
	/** @type Promise<import('./sync-proto-modules/utils/index.mjs').ProtoHandler[]> */
	const initialValue = Promise.resolve( [] );
	const handlers = await [
		syncFs,
		typedocSubmodule,
		packageJson,
		readme,
		circleCi,
		changelog,
		issueTemplate,
	].reduce(
		( acc, protoHandlerFactory ) => acc.then( v => Promise.resolve( protoHandlerFactory( checkOnly ) )
			.then( w => [ ...v, w ] ) ),
		initialValue );
	const setups = new WeakMap();
	for( const handler of handlers ){
		setups.set( handler, await handler.setup?.( protoDir, projects, handlers ) );
	}
	for( const handler of handlers ){
		await Promise.all( projects.map( p => handler.run?.( protoDir, p, projects, handlers, setups.get( handler ) ) ) );
	}
	for( const handler of handlers ){
		await handler.tearDown?.( protoDir, projects, handlers, setups.get( handler ) );
	}
	summarizeErrors();
} catch( e ){
	console.error( e );
	process.exit( 1 );
}
