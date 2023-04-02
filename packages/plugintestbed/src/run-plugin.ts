import assert from 'assert';
// eslint-disable-next-line no-restricted-imports -- OS-specific path manipulation
import { resolve } from 'path';

import { Many, castArray } from 'lodash';
import { Application, ArgumentsReader, LogLevel, TSConfigReader, TypeDocOptions, TypeDocReader } from 'typedoc';

import { Repository } from '../../../node_modules/typedoc/dist/lib/converter/utils/repository';

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
	const fullOpts = {
		...baseOptions,
		...options,
	};
	jest.spyOn( Repository, 'tryCreateRepository' ).mockImplementation( ( path, gitRevision, gitRemote ) => {
		if( !gitRemote || !gitRevision ){
			return undefined;
		}
		const repo = new Repository( process.cwd(), gitRevision, [ `http://stub.git/${gitRemote}` ] );
		repo.user = 'FAKE-USER';
		repo.project = 'FAKE-PROJECT';
		repo.hostname = 'stub.git';
		repo.contains = jest.fn().mockReturnValue( true );
		return repo;
	} );
	const errorOnBootstrapSpy = jest.spyOn( console, 'error' );
	app.bootstrap( fullOpts );
	expect( errorOnBootstrapSpy ).not.toHaveBeenCalled();
	errorOnBootstrapSpy.mockRestore();
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
