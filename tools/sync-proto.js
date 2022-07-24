const { resolve } = require( 'path' );

const { normalizePath } = require( 'typedoc' );

const { changelog } = require( './sync-proto-modules/changelog' );
const { circleCi } = require( './sync-proto-modules/circleci' );
const { issueTemplate } = require( './sync-proto-modules/issue-template' );
const { packageJson } = require( './sync-proto-modules/package-json' );
const { readme } = require( './sync-proto-modules/readme' );
const { syncFs } = require( './sync-proto-modules/sync-fs' );
const { typedocSubmodule } = require( './sync-proto-modules/typedoc-submodule' );
const { selectProjects, createStash } = require( './utils' );

if( require.main === module ){
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
	const protoDir = normalizePath( resolve( __dirname, 'proto' ) );
	( async () => {
		try {
			if( stash ){
				await createStash( `Sync packages ${projects.map( p => p.name ).join( ' ' )}` );
			}
			/** @type Promise<import('./sync-proto-modules/utils').ProtoHandler[]> */
			const initialValue = Promise.resolve( [] );
			const handlers = await [
				syncFs,
				packageJson,
				readme,
				typedocSubmodule,
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
		} catch( e ){
			console.error( e );
			process.exit( 1 );
		}
	} )();
}
