const { relative } = require( 'path' );

const { default: concurrently, Logger } = require( 'concurrently' );

const { getProjects, commonPath } = require( './utils' );

const projects = getProjects();
const common = commonPath( projects );

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

const baseLog = Logger.prototype.log;
Logger.prototype.log = function( prefix, text, command ) {
	text = text.replace( /^$\n/gm, '' );
	baseLog.call( this, prefix, text, command );
};
concurrently( projects.map( ( project, i ) => ( {
	cwd: project,
	name: relative( common, project ).replace( /^typedoc-/, '' ),
	prefixColor: colors[i],
	command: process.argv[2].replace( /\{\}/g, project ),
} ) ) );
