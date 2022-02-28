const { existsSync } = require( 'fs' );
const { resolve } = require( 'path' );

const { isString } = require( 'lodash' );

const { getProjects } = require( './tools/utils' );

const projects = getProjects();
const maxNameLength = Math.max( ...projects.map( p => p.name.length ) );
module.exports = {
	projects: projects
		.map( ( { path, ...other } ) => {
			const jestConfigPath = [ 'jest.workspace.config.js', 'jest.config.js' ]
				.map( c => resolve( path, c ) )
				.find( existsSync );
			return { ...other, path, jestConfigPath };
		} )
		.filter( ( { jestConfigPath } ) => isString( jestConfigPath ) )
		.map( ( { jestConfigPath, path, name } ) => {
			const config = require( jestConfigPath );
			if( config.projects ){
				return config.projects.map( pp => ( { name, jestConfig: { ...pp, rootDir: path }} ) );
			} else {
				return { name, jestConfig: { ...config, rootDir: path }};
			}
		} )
		.flat( 1 )
		.map( ( { jestConfig, name } ) => {
			if( jestConfig.displayName ){
				const sep = `${' '.repeat( maxNameLength - name.length )} ⇒ `;
				jestConfig.displayName = {
					...jestConfig.displayName,
					name: `${name}${sep}${jestConfig.displayName.name}`,
				};
			} else {
				jestConfig.displayName = {
					name,
				};
			}
			return jestConfig;
		} ),
};
