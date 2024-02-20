import assert from 'assert';
// eslint-disable-next-line no-restricted-imports -- OS-specific path manipulation
import { resolve } from 'path';

import { Many, castArray } from 'lodash';
import { Application, ArgumentsReader, LogLevel, TSConfigReader, TypeDocOptions, TypeDocReader } from 'typedoc';

import { GitRepository } from '../../../node_modules/typedoc/dist/lib/converter/utils/repository';

export const runPlugin = async (
	testDir: string,
	pluginPaths: Many<string>,
	{ options, output = resolve( testDir, './docs' ) }: {options?: Partial<TypeDocOptions>; output?: string} = {},
) => {
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
	const app = await Application.bootstrapWithPlugins( fullOpts, [
		new ArgumentsReader( 0, [] ),
		new TypeDocReader(),
		new TSConfigReader(),
	] );
	jest.spyOn( GitRepository, 'tryCreateRepository' ).mockImplementation( ( _path, _sourceLinkTemplate, gitRevision, gitRemote, _logger ) => {
		if( !gitRemote || !gitRevision ){
			return undefined;
		}
		const repo = new GitRepository( process.cwd(), gitRevision, 'https://stub.git/FAKE-USER/FAKE-PROJECT/blob/{gitRevision}/{path}#L{line}' );
		jest.spyOn( repo, 'getURL' );
		return repo;
	} );
	const errorOnBootstrapSpy = jest.spyOn( console, 'error' );
	expect( errorOnBootstrapSpy ).not.toHaveBeenCalled();
	errorOnBootstrapSpy.mockRestore();
	const project = await app.convert();
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

export const setupTypedocApplication = async ( options?: Partial<TypeDocOptions> | undefined ) => {
	const app = await Application.bootstrap( {
		logLevel: LogLevel.Error,
		...options,
	} );
	return app;
};
