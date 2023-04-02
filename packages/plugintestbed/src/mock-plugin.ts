// eslint-disable-next-line no-restricted-imports -- OS-specific path manipulation
import { resolve } from 'path';

import { isNil } from 'lodash';
import { Converter, LogLevel, ProjectReflection, Renderer, SourceReference } from 'typedoc';

import { ABasePlugin } from '@knodes/typedoc-pluginutils';

export type MockPlugin<T extends ABasePlugin = ABasePlugin> = jest.MockedObjectDeep<T>
export const mockPlugin = <T extends ABasePlugin = ABasePlugin>( props: Partial<MockPlugin<T>> = {} ): MockPlugin<T> => {
	const mockLogger = {
		makeChildLogger: jest.fn(),
		error: jest.fn().mockImplementation( v => fail( `Unexpected error log: ${typeof v === 'function' ? v() : v}` ) ),
		warn: jest.fn().mockImplementation( v => fail( `Unexpected warn log: ${typeof v === 'function' ? v() : v}` ) ),
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
		logger: { level: LogLevel.Verbose, log: jest.fn() },
		options: {
			getValue: jest.fn().mockImplementation( k => isNil( k ) ? opts : opts[k] ),
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
	return plugin;
};

export const createMockProjectWithPackage = () => {
	const project = new ProjectReflection( 'TEST' );
	project.sources = [
		new SourceReference( resolve( process.cwd(), 'package.json' ), 1, 1 ),
	];
	return project;
};
