const { constants } = require( 'fs' );
const { readFile, access, open } = require( 'fs/promises' );
const { resolve, dirname, relative } = require( 'path' );

const { red, bold, green } = require( 'chalk' );

const { spawn, globAsync, createStash } = require( './utils' );

const command = process.argv[2];
const flags = process.argv.slice( 3 );
const noStash = flags.includes( '--no-stash' );
const getPatchName = f => `${f}.patch`;
const getDiffedFile = async file => {
	const content = await readFile( file, 'utf-8' );
	const header = content.match( /^.*?Edit of <(.+)>.*?\n/ );
	if( !header ){
		console.error( `Can't extract header from ${file}` );
	}
	const dir = dirname( resolve( file ) );
	const sourceFile = relative( process.cwd(), resolve( dir, header[1].replace( /^~\//, `${dirname( __dirname )}/` ) ) );
	return sourceFile;
};
( async () => {
	switch( command ){
		case 'diff': {
			if( !noStash ){
				await createStash( 'typedoc-patcher: diff' );
			}
			const generatedFiles = await globAsync( '**/*.GENERATED?(.*)', { ignore: [ '**/node_modules/**', getPatchName( '**/*.GENERATED?(.*)' ) ] } );
			await Promise.all( generatedFiles.map( async file => {
				const sourceFile = await getDiffedFile( file );
				await access( sourceFile, constants.W_OK );
				// eslint-disable-next-line no-bitwise -- Binary mask mode
				const patchHandle = await open( getPatchName( file ), constants.O_WRONLY | constants.O_CREAT );
				const patchFileStream = patchHandle.createWriteStream();
				await spawn( 'git', [ 'diff', '--no-renames', '--no-index', '--relative', sourceFile, file ], { stdio: [ null, patchFileStream, process.stderr ] } ).catch( () => Promise.resolve() );
				patchFileStream.close();
				console.log( `Generated patch from ${bold( red( sourceFile ) )} to ${bold( green( file ) )}` );
			} ) );
		} break;

		case 'apply': {
			if( !noStash ){
				await createStash( 'typedoc-patcher: apply' );
			}
			const patchFiles = await globAsync( getPatchName( '**/*.GENERATED?(.*)' ), { ignore: [ '**/node_modules/**' ] } );
			await Promise.all( patchFiles.map( async patchFile => {
				await spawn( 'git', [ 'apply', patchFile ], { stdio: [ null, null, process.stderr ] } );
				const file = patchFile.replace( /\.patch$/, '' );
				const sourceFile = await getDiffedFile( file );
				const sourceFileAbs = resolve( sourceFile );
				await spawn( 'git', [ 'checkout', 'HEAD', '--', sourceFileAbs ], { cwd: dirname( sourceFileAbs ) } );
				console.log( `Applied patch from ${bold( red( sourceFile ) )} to ${bold( green( file ) )}` );
			} ) );
		} break;

		default: {
			throw new Error( `Invalid command "${command}"` );
		}
	}

} )();
