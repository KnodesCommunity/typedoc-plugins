import assert from 'assert';
// eslint-disable-next-line no-restricted-imports -- OS-specific path manipulation
import { resolve } from 'path';

import { isNil } from 'lodash';
import { Converter, LogLevel, ProjectReflection, Renderer, SourceReference } from 'typedoc';

import { ABasePlugin } from '@knodes/typedoc-pluginutils';

export type MockPlugin<T extends ABasePlugin = ABasePlugin> = jest.MockedObjectDeep<T> & {setOptions: ( opts: any ) => void}
export const mockPlugin = <T extends ABasePlugin = ABasePlugin>( props: Partial<MockPlugin<T>> = {} ): MockPlugin<T> => {
	const mockLogger = {
		makeChildLogger: jest.fn(),
		error: jest.fn().mockImplementation( v => assert.fail( `Unexpected error log: ${typeof v === 'function' ? v() : v}` ) ),
		warn: jest.fn().mockImplementation( v => assert.fail( `Unexpected warn log: ${typeof v === 'function' ? v() : v}` ) ),
		log: jest.fn(),
		verbose: jest.fn(),
		info: jest.fn(),
	};
	mockLogger.makeChildLogger.mockReturnValue( mockLogger );
	const opts: any = {
		options: process.cwd(),
		pluginOpts: {},
	};
	const application: any = {
		logger: { level: LogLevel.Verbose, ...mockLogger, makeChildLogger: undefined },
		options: {
			getValue: jest.fn().mockImplementation( k => opts[k] ),
			getRawValues: jest.fn().mockImplementation( () => opts ),
			_setOptions: new Set(),
		},
	};
	application.converter = new Converter( application );
	application.renderer = new Renderer( application );
	application.application = application;
	const plugin = Object.create( ABasePlugin.prototype, Object.fromEntries( Object.entries( {
		application,
		rootDir: process.cwd(),
		logger: mockLogger,
		pluginOptions: {
			getValue: jest.fn().mockImplementation( k => isNil( k ) ? opts.pluginOpts : opts.pluginOpts[k] ),
		},
		...props,
	} ).map( ( ( [ k, v ] ) => [ k, { value: v } ] ) ) ) );
	plugin.setOptions = ( newOpts: any ) => opts.pluginOpts = newOpts;
	return plugin;
};

export const createMockProjectWithPackage = () => {
	const project = new ProjectReflection( 'TEST' );
	project.sources = [
		new SourceReference( resolve( process.cwd(), 'package.json' ), 1, 1 ),
	];
	return project;
};
