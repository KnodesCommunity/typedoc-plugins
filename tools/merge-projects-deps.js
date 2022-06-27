const { writeFile } = require( 'fs/promises' );
const { resolve } = require( 'path' );

const { normalizePath } = require( 'typedoc' );

const { getProjects, formatPackages } = require( './utils' );

const projects = getProjects().map( v => ( {
	...v,
	pkgJson: require( resolve( v.path, 'package.json' ) ),
} ) );

const packagePath = normalizePath( resolve( __dirname, '../package.json' ) );
const basePkg = require( packagePath );
const newPkg = projects.reduce( ( acc, { path, pkgJson } ) => {
	Object.entries( pkgJson )
		.filter( ( [ k ] ) => k.toLowerCase().includes( 'dependencies' ) )
		.forEach( ( [ k, v ] ) => {
			const accDeps = acc[k] ?? {};
			const filteredDeps = Object.fromEntries( Object.entries( v )
				.filter( ( [ depName, depV ] ) => {
					if( depName in accDeps && accDeps[depName] !== depV ){
						console.warn( `Mismatching dependency ${depName} from ${path}: ${accDeps[depName]} so far vs ${depV}` );
						accDeps[depName] = depV;
					} else if( !projects.some( p => p.pkgJson.name === depName ) ){
						return [ depName, depV ];
					}
				} ) );
			acc[k] = {
				...accDeps,
				...filteredDeps,
			};
			acc.devDependencies = {
				...acc.devDependencies,
				[pkgJson.name]: `file:${path}`,
			};
		} );
	return acc;
}, basePkg );

module.exports = async () => {
	await writeFile( packagePath, JSON.stringify( newPkg ) );
	await formatPackages( packagePath );
};
