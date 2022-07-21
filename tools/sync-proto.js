const { resolve } = require( 'path' );

const { normalizePath } = require( 'typedoc' );

const { circleCi } = require( './sync-proto-modules/circleci' );
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
			].reduce(
				( acc, protoHandlerFactory ) => acc.then( v => Promise.resolve( protoHandlerFactory( checkOnly ) )
					.then( w => [ ...v, w ] ) ),
				initialValue );
			for( const { setup } of handlers ){
				if( setup ){
					await setup( protoDir, projects, handlers );
				}
			}
			for( const { run } of handlers ){
				await Promise.all( projects.map( p => run( protoDir, p, projects, handlers ) ) );
			}
			for( const { tearDown } of handlers ){
				if( tearDown ){
					await tearDown( protoDir, projects, handlers );
				}
			}
		} catch( e ){
			console.error( e );
			process.exit( 1 );
		}
	} )();
}
