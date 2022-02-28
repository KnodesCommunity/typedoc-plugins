const { resolve } = require( 'path' );

const { default: concurrently, Logger } = require( 'concurrently' );
const stripAnsi = require( 'strip-ansi' );

const { getProjects } = require( './utils' );

const projects = getProjects();

const colors = [
	'red',
	'green',
	'yellow',
	'blue',
	'magenta',
	'cyan',
	'redBright',
	'greenBright',
	'yellowBright',
	'blueBright',
	'magentaBright',
	'cyanBright',
	'white',
	'whiteBright',
	'blackBright',
	'black',
];

const depTypes = [ 'devDependencies', 'dependencies', 'peerDependencies', 'optionalDependencies', 'bundledDependencies' ];
const isDependencyOf = ( pkgA, pkgB ) => depTypes.some( depType => pkgB[depType] && pkgA.name in pkgB[depType] );
const orderedProjects = projects
	.map( ( { path, ...other } ) => ( { ...other, path, package: require( resolve( path, 'package.json' ) ) } ) )
	.sort( ( { package: pkgA }, { package: pkgB } ) => {
		const aDepOfB = isDependencyOf( pkgA, pkgB );
		const bDepOfA = isDependencyOf( pkgB, pkgA );
		if( aDepOfB && bDepOfA ){
			throw new Error( `Circular dependency between ${pkgA.name} & ${pkgB.name}` );
		} else if( aDepOfB === bDepOfA ) {
			return 0;
		} else if( aDepOfB ){
			return -1;
		} else if( bDepOfA ) {
			return 1;
		} else {
			throw new Error( 'Nope' );
		}
	} );

const maxNameLength = Math.max( ...orderedProjects.map( p => p.name.length ) );
const baseLog = Logger.prototype.log;
Logger.prototype.log = function( prefix, text, command ) {
	const prefixLength = stripAnsi( prefix ).length - 3;
	const pad = ' '.repeat( maxNameLength - prefixLength );
	text = text
		.split( '\n' )
		.filter( v => v.trim() )
		.map( t => pad + t )
		.join( '\n' );
	text += '\n';
	baseLog.call( this, prefix, text, command );
};

/**
 * @param {Partial<import('concurrently').ConcurrentlyOptions>} opts - The concurrently options.
 * @param {(project: string) => string} commandFactory - The command factory. Called with the project relative path.
 * @returns the concurrently result.
 */
module.exports = ( opts, commandFactory = project => process.argv[2].replace( /\{\}/g, project ) ) => concurrently(
	orderedProjects
		.map( ( { path, name }, i ) => ( {
			cwd: path,
			name,
			prefixColor: colors[i],
			command: commandFactory( path ),
		} ) ),
	opts );
