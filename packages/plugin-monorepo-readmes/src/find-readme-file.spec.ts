import { basename, resolve } from 'path';

import { DeclarationReflection, ProjectReflection, ReflectionKind, SourceFile, UrlMapping } from 'typedoc';

import { restoreFs, setVirtualFs  } from '#plugintestbed';

import { findReadmeFile } from './find-readme-file';

const rootDir = resolve( __dirname, '..' );

beforeEach( () => {
	process.chdir( rootDir );
	jest.clearAllMocks();
} );
afterEach( restoreFs );
const buildMapping = ( filename: string ) => {
	const reflection = new DeclarationReflection( 'foo', ReflectionKind.Module, new ProjectReflection( 'test' ) );
	reflection.sources = [
		{ file: new SourceFile( resolve( rootDir, filename ) ), character: 0, fileName: basename( filename ), line: 0 },
	];
	return new UrlMapping( 'foo', reflection, jest.fn() );
};
describe( 'Readme file location', () => {
	it( 'should capture README file along with a "package.json" file', () => {
		setVirtualFs( {
			foo: {
				'src': {
					'index.ts': 'export * from "./hello";',
					'hello.ts': 'export const hello = "HELLO"',
				},
				'package.json': '',
				'README.md': 'hello',
			},
		} );
		expect( findReadmeFile( [ 'package.json' ], buildMapping( 'foo/src/index.ts' ) ) ).toEqual( {
			relative: 'README.md',
			absolute: resolve( rootDir, 'foo/README.md' ),
		} );
	} );
	it( 'should return "undefined" if no readme is found along with the "package.json" file', () => {
		setVirtualFs( {
			foo: {
				'src': {
					'index.ts': 'export * from "./hello";',
					'hello.ts': 'export const hello = "HELLO"',
				},
				'package.json': '',
			},
		} );
		expect( findReadmeFile( [ 'package.json' ], buildMapping( 'foo/src/index.ts' ) ) ).toEqual( undefined );
	} );
	it( 'should fallback on each readme targets', () => {
		setVirtualFs( {
			foo: {
				'bar': {
					'src': {
						'index.ts': 'export * from "./hello";',
						'hello.ts': 'export const hello = "HELLO"',
					},
					'package.json': '',
				},
				'project.json': '',
				'readme.md': '',
			},
		} );
		expect( findReadmeFile( [ 'package.json', 'project.json' ], buildMapping( 'foo/bar/src/index.ts' ) ) ).toEqual( {
			relative: 'readme.md',
			absolute: resolve( rootDir, 'foo/readme.md' ),
		} );
	} );
} );
