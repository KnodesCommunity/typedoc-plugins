import assert from 'assert';
import { resolve } from 'path';

import { Many, castArray } from 'lodash';

import { Application, ArgumentsReader, LogLevel, TSConfigReader, TypeDocOptions, TypeDocReader } from 'typedoc';

export const runPlugin = async (
	testDir: string,
	pluginPaths: Many<string>,
	{ options, output = resolve( testDir, './docs' ) }: {options?: Partial<TypeDocOptions>; output?: string} = {},
) => {
	const app = new Application();
	app.options.addReader( new ArgumentsReader( 0, [] ) );
	app.options.addReader( new TypeDocReader() );
	app.options.addReader( new TSConfigReader() );
	const baseOptions: Partial<TypeDocOptions> = {
		treatWarningsAsErrors: true,
		plugin: castArray( pluginPaths ),
		gitRemote: 'origin',
		gitRevision: 'develop',
	};
	app.bootstrap( {
		...baseOptions,
		...options,
	} );
	const project = app.convert();
	expect( project ).toBeTruthy();
	assert( project );
	app.validate( project );
	await app.generateDocs( project, output );
};
export const runPluginBeforeAll = (
	testDir: string,
	pluginPaths: Many<string>,
	opts?: {options?: Partial<TypeDocOptions>; output?: string},
) => beforeAll( () => runPlugin( testDir, pluginPaths, opts ), ( process.env.CI === 'true' ? 120 : 60 ) * 1000 );

export const setupTypedocApplication = ( options?: Partial<TypeDocOptions> | undefined ) => {
	const app = new Application();
	app.bootstrap( {
		logLevel: LogLevel.Error,
		...options,
	} );
	return app;
};
