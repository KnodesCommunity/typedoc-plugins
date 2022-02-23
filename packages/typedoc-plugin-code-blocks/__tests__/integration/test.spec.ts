import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { Application, ArgumentsReader, TSConfigReader, TypeDocOptions, TypeDocReader } from 'typedoc';

const rootDir = resolve( __dirname, '../mock-fs' );
beforeEach( () => {
	process.chdir( rootDir );
} );
describe( 'Real behavior', () => {
	it( 'should render correctly', async () => {
		const app = new Application();
		app.options.addReader( new ArgumentsReader( 0, [] ) );
		app.options.addReader( new TypeDocReader() );
		app.options.addReader( new TSConfigReader() );
		const baseOptions: Partial<TypeDocOptions> = {
			entryPoints: [ resolve( rootDir, './src/test.ts' ) ],
			tsconfig: resolve( rootDir, './tsconfig.json' ),
			treatWarningsAsErrors: true,
			plugin: [ resolve( __dirname, '../../src/index' ) ],
		};
		app.bootstrap( {
			...baseOptions,
			'code-blocks-directories': { blocks: resolve( rootDir, 'blocks' ) },
		} as any );
		const project = app.convert()!;
		app.validate( project );
		await app.generateDocs( project, resolve( rootDir, './docs' ) );
		const content = await readFile( resolve( rootDir, 'docs/classes/Test.html' ), 'utf-8' );
		expect( content ).toContain( '{</span><span class="hl-1">&quot;Hello&quot;</span><span class="hl-0">: </span><span class="hl-2">&quot;World&quot;</span><span class="hl-0">}' );
		expect( content ).toMatchSnapshot();
	} );
} );
