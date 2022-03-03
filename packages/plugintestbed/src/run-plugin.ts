import assert from 'assert';
import { resolve } from 'path';

import { Many, castArray } from 'lodash';

import { Application, ArgumentsReader, TSConfigReader, TypeDocOptions, TypeDocReader } from 'typedoc';

export const runPlugin = async (
	testDir: string,
	pluginPaths: Many<string>,
	{ options, output = resolve( testDir, './docs' ) }: {options?: Record<string, any>; output?: string}= {},
) => {
	const app = new Application();
	app.options.addReader( new ArgumentsReader( 0, [] ) );
	app.options.addReader( new TypeDocReader() );
	app.options.addReader( new TSConfigReader() );
	const baseOptions: Partial<TypeDocOptions> = {
		treatWarningsAsErrors: true,
		plugin: castArray( pluginPaths ),
		gitRemote: 'http://example.com',
		gitRevision: 'test',
	};
	app.bootstrap( {
		...options,
		...baseOptions,
	} );
	const project = app.convert();
	expect( project ).toBeTruthy();
	assert( project );
	app.validate( project );
	await app.generateDocs( project, output );
};
