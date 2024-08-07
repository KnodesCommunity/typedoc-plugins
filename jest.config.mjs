import { resolve } from 'path';
import { pathToFileURL } from 'url';

import { getProjects } from './tools/utils.mjs';

const projects = getProjects();
const maxNameLength = Math.max( ...projects.map( p => p.name.length ) );
const projectsConfigs = await Promise.all( projects
	.map( ( { path, ...other } ) => ( { ...other, path, jestConfigPath: pathToFileURL( resolve( path, 'jest.config.mjs' ) ) } ) )
	.map( async ( { jestConfigPath, name } ) => {
		const { default: config } = await import( jestConfigPath );
		if( config.projects ){
			return config.projects.map( pp => ( { name, jestConfig: { ...pp }} ) );
		} else {
			return { name, jestConfig: { ...config }};
		}
	} ) );
export default {
	projects: projectsConfigs
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
