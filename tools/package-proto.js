const assert = require( 'assert' );
const { createHash } = require( 'crypto' );
const { readFile, writeFile, mkdir, copyFile, access, unlink } = require( 'fs/promises' );
const { resolve, join } = require( 'path' );

const { bold, yellow } = require( 'chalk' );
const { defaultsDeep, partition, memoize, isString, cloneDeep, uniq } = require( 'lodash' );

const { spawn, globAsync, selectProjects, createStash } = require( './utils' );

const getDocsUrl = pkgJson => `https://knodescommunity.github.io/typedoc-plugins/modules/${( pkgJson.name ?? assert.fail( 'No name' ) ).replace( /[^a-z0-9]/gi, '_' )}.html`;
/**
 * @typedef {import('./utils').Project} Project
 */
/**
 * @typedef {{
 * 	setup?: (proto: string; projects: Project[], handlers: ProtoHandler[]) => Promise<void>;
 * 	tearDown?: (proto: string; projects: Project[], handlers: ProtoHandler[]) => Promise<void>;
 * 	run: (proto: string; project: Project, handlers: ProtoHandler[]) => Promise<void>;
 * }} ProtoHandler
 */

const readProjectPackageJson = projectPath => {
	const projectPkgPath = resolve( projectPath, 'package.json' );
	try {
		return {
			packageContent: require( projectPkgPath ),
			path: projectPkgPath,
		};
	} catch( e ){
		if( e.code === 'MODULE_NOT_FOUND' ){
			return {
				packageContent: undefined,
				path: projectPkgPath,
			};
		} else {
			throw e;
		}
	}
};

/**
 * @param {string} file
 */
const tryReadFile = async file => {
	try{
		return await readFile( file, 'utf-8' );
	} catch( e ){
		return undefined;
	}
};

/**
 * @returns {ProtoHandler}
 */
const packageJson = () => {
	const getProtoPkg = memoize( proto => readFile( resolve( proto, 'package.json' ), 'utf-8' ) );
	return {
		run: async ( proto, { path: projectPath } ) => {
			const { packageContent = {}, path: packagePath } = readProjectPackageJson( projectPath ) ?? {};
			const protoPkgContent = await getProtoPkg( proto );
			const protoPkg = JSON.parse( protoPkgContent
				.replace( /\{projectRelDir\}/g, projectPath )
				.replace( /\{projectTypeDocUrl\}/g, getDocsUrl( packageContent ) ) );
			const newProjectPkg = defaultsDeep( cloneDeep( protoPkg ), packageContent );
			[ 'keywords', 'files' ].forEach( prop => newProjectPkg[prop] = uniq( [
				...( protoPkg[prop] ?? [] ),
				...( packageContent[prop] ?? [] ),
			]
				.map( k => k.toLowerCase() ) )
				.sort() );
			await writeFile( packagePath, JSON.stringify( newProjectPkg, null, 2 ) );
		},
		tearDown: async( proto, projects ) => {
			await spawn( 'npx', [ 'format-package', '--write', ...projects.map( p => resolve( p.path, 'package.json' ) ) ] );
		},
		handleFile: filename => /(\/|^)package\.json$/.test( filename ),
	};
};

const checksum = async file => createHash( 'md5' )
	.update( await readFile( file, 'utf-8' ), 'utf-8' )
	.digest( 'hex' );

/**
 * @returns {ProtoHandler}
 */
const syncFs = () => {
	const cacheFile = resolve( __dirname, '.package-proto-cache' );
	const readCache = memoize( async () => {
		try {
			const cacheContent = ( await tryReadFile( cacheFile, 'utf-8' ) ) ?? '';
			return cacheContent
				.split( '\n' )
				.filter( v => v.trim() )
				.reduce( ( acc, line ) => {
					const parts = line.split( '::' ).map( p => p.trim() );
					if( parts.length === 0 ){
						return acc;
					}
					assert( parts.length === 2 );
					const [ file, hash ] = parts;
					acc[file] = hash;
					return acc;
				}, {} );
		} catch( e ){
			return {};
		}
	} );
	const protoFs = memoize( async ( proto, handlers ) => {
		const filesDirs = ( await globAsync( '**', { cwd: proto, ignore: [ '**/node_modules/**' ], mark: true, dot: true } ) )
			.filter( fd => !( handlers.some( h => h.handleFile?.( fd ) ?? false ) ) );
		const [ dirs, files ] = partition( filesDirs, p => p.endsWith( '/' ) );
		return { dirs, files };
	} );
	const getChangedFiles = memoize( async ( proto, handlers ) => {
		const [ cacheContent, { files } ] = await Promise.all( [
			readCache(),
			protoFs( proto, handlers ),
		] );
		const changedFiles = {};
		await Promise.all( files.map( async file => {
			const hash = await checksum( resolve( proto, file ) );
			if( !cacheContent[file] || cacheContent[file] !== hash ){
				changedFiles[file] = hash;
			}
		} ) );
		Object.keys( cacheContent ).forEach( k => {
			if( !files.includes( k ) ){
				changedFiles[k] = undefined;
			}
		} );
		return changedFiles;
	} );
	const conflicting = [];
	return {
		run: async ( proto, { path: projectPath }, handlers ) => {
			const { dirs, files } = await protoFs( proto, handlers );
			for( const dir of dirs ){
				await mkdir( resolve( projectPath, dir ), { recursive: true } );
			}
			const changedFiles = await getChangedFiles( proto, handlers );
			await Promise.all( Object.entries( changedFiles ).map( async ( [ file, protoSum ] ) => {
				const source = resolve( proto, file );
				const dest = resolve( projectPath, file );
				if( protoSum ){
					try{
						await access( dest );
						const prevSum = ( await readCache() )[file];
						if( ( prevSum ?? protoSum ) !== await checksum( dest ) ){
							conflicting.push( join( projectPath, file ) );
						}
					} catch( err ){
						if ( err.code !== 'ENOENT' ) {
							throw err;
						}
					}
					await copyFile( source, dest );
				} else {
					try{
						await unlink( dest );
						// eslint-disable-next-line no-empty -- No error
					} catch( e ){}
				}
			} ) );
			await Promise.all( files.map( async file => {
				if( file in changedFiles ){
					return;
				}
				const absFile = resolve( projectPath, file );
				try{
					await access( absFile );
				} catch( e ){
					await copyFile( resolve( proto, file ), absFile );
				}
			} ) );
		},
		tearDown: async ( proto, _projects, handlers ) => {
			conflicting.forEach( c => {
				console.error( `File ${bold( c )} has been changed compared to prototype. Please review git changes.` );
			} );
			const [ cache, changed ] = await Promise.all( [
				readCache(),
				getChangedFiles( proto, handlers ),
			] );
			const newCache = {
				...cache,
				...changed,
			};
			await writeFile( cacheFile, Object.entries( newCache )
				.filter( ( [ , v ] ) => isString( v ) )
				.map( entry => entry.join( ' :: ' ) )
				.join( '\n' ) );
		},
	};
};

/**
 * @returns {ProtoHandler}
 */
const readme = () => {
	/**
	 * @param {string} readmeFile
	 * @param {string} projectPath
	 */
	const replaceHeader = async ( readmeFile, projectPath ) => {
		const readmeContent = ( await tryReadFile( readmeFile, 'utf-8' ) ) ?? '';
		const { packageContent } = readProjectPackageJson( projectPath );
		if( !packageContent ){
			throw new Error();
		}
		let newHeader = `# ${packageContent.name}`;
		if( packageContent.description ){
			newHeader += `\n\n> ${packageContent.description}`;
		}
		const shield = ( label, suffix, link ) => `[![${label}](https://img.shields.io${suffix}?style=for-the-badge)](${link})`;
		newHeader += `\n
${shield( 'npm version', `/npm/v/${packageContent.name}`, `https://www.npmjs.com/package/${packageContent.name}` )}
${shield( 'npm downloads', `/npm/dm/${packageContent.name}`, `https://www.npmjs.com/package/${packageContent.name}` )}
[![Compatible with TypeDoc](https://img.shields.io/badge/For%20typedoc-${packageContent.peerDependencies.typedoc}-green?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/typedoc)

---

${shield( 'CircleCI', '/circleci/build/github/KnodesCommunity/typedoc-plugins/main', 'https://circleci.com/gh/KnodesCommunity/typedoc-plugins/tree/main' )}
${shield( 'Code Climate coverage', '/codeclimate/coverage-letter/KnodesCommunity/typedoc-plugins', 'https://codeclimate.com/github/KnodesCommunity/typedoc-plugins' )}
${shield( 'Code Climate maintainability', '/codeclimate/maintainability/KnodesCommunity/typedoc-plugins', 'https://codeclimate.com/github/KnodesCommunity/typedoc-plugins' )}`;
		const typedocVer = packageContent.dependencies?.['typedoc'] ?? packageContent.peerDependencies?.['typedoc'];
		if( typedocVer ){
			newHeader += `

## Compatibility

This plugin version should match TypeDoc \`${typedocVer}\` for compatibility.`;
		}
		newHeader += `

## Quick start

\`\`\`sh
npm install --save-dev ${packageContent.name}${typedocVer ? ` typedoc@${typedocVer}` : ''}
\`\`\`

For more infos, please refer to [the documentation](${getDocsUrl( packageContent )})`;
		newHeader = `<!-- HEADER -->
${newHeader}
<!-- HEADER end -->
`;
		const headerRegex = /^<!-- HEADER -->(.*?)<!-- HEADER end -->\n/s;
		if( !headerRegex.test( readmeContent ) ){
			console.log( yellow( `Header not found in ${readmeFile}` ) );
		}
		const newReadme = newHeader + readmeContent.replace( /^<!-- HEADER -->(.*?)<!-- HEADER end -->(\n|$)/s, '' );
		await writeFile( readmeFile, newReadme );
	};
	return {
		run: async ( _proto, { path: projectPath } ) => {
			const readmeFiles = await globAsync( `${projectPath}/@(readme|README).@(md|MD)` );
			if( readmeFiles.length > 1 ){
				throw new Error( 'Multiple README files' );
			}
			const readmeFile = readmeFiles[0] ?? `${projectPath}/README.md`;
			await replaceHeader( readmeFile, projectPath );
		},
		handleFile: filename => /(\/|^)readme\.md$/i.test( filename ),
	};
};

if( require.main === module ){
	const { explicitProjects, noStash } = process.argv.slice( 2 )
		.reduce( ( acc, arg ) => {
			if( arg === '--no-stash' ){
				return { ...acc, noStash: true };
			} else {
				return { ...acc, explicitProjects: [ ...acc.explicitProjects, arg ] };
			}
		}, { explicitProjects: [], noStash: false } );
	const projects = selectProjects( explicitProjects );
	const protoDir = resolve( __dirname, 'proto' );
	( async () => {
		if( !noStash ){
			await createStash( `Sync packages ${projects.map( p => p.name ).join( ' ' )}` );
		}
		const handlers = [
			syncFs(),
			packageJson(),
			readme(),
		];
		for( const { setup } of handlers ){
			await setup?.( protoDir, projects, handlers );
		}
		for( const { run } of handlers ){
			await Promise.all( projects.map( p => run( protoDir, p, handlers ) ) );
		}
		for( const { tearDown } of handlers ){
			await tearDown?.( protoDir, projects, handlers );
		}
	} )();
}

