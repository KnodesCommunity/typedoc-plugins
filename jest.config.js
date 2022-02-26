const { existsSync } = require( 'fs' );

const { dirname, resolve, basename } = require( 'path' );

const { sync } = require( 'glob' );

const packagesWithJest = sync( './packages/*/jest.config.js' );
module.exports = {
	projects: packagesWithJest
		.map( p => {
			const dir = dirname( p );
			const workspace = resolve( dir, 'jest.workspace.config.js' );
			if( existsSync( workspace ) ){
				return workspace;
			} else {
				return p;
			}
		} )
		.map( p => {
			const dir = dirname( p );
			const config = require( p );
			if( config.projects ){
				return config.projects.map( pp => ( { ...pp, rootDir: dir } ) );
			} else {
				return { ...config, rootDir: dir };
			}
		} )
		.flat( 1 )
		.map( config => {
			if( config.displayName ){
				config.displayName = {
					...config.displayName,
					name: `${basename( config.rootDir )} ${config.displayName.name}`,
				};
			} else {
				config.displayName = {
					name: basename( config.rootDir ),
				};
			}
			return config;
		} ),
};
