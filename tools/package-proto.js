const assert = require( 'assert' );
const { createHash } = require( 'crypto' );
const { readFile, writeFile, mkdir, copyFile, access, unlink } = require( 'fs/promises' );
const { EOL } = require( 'os' );
const { resolve, join, normalize } = require( 'path' );

const { bold, yellow } = require( 'chalk' );
const { defaultsDeep, partition, memoize, isString, cloneDeep, uniq } = require( 'lodash' );

const { spawn, globAsync, selectProjects, createStash } = require( './utils' );

const normalizePath = path => normalize( path ).replace( /\\/g, '/' );
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

const readProjectPackageJson = async projectPath => {
	const projectPkgPath = resolve( projectPath, 'package.json' );
	const content = await tryReadFile( projectPkgPath );
	if( content ){
		return {
			packageContent: JSON.parse( content ),
			path: projectPkgPath,
		};
	} else {
		return {
			packageContent: undefined,
			path: projectPkgPath,
		};
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
			const { packageContent = {}, path: packagePath } = await readProjectPackageJson( projectPath ) ?? {};
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
			await spawn(
				process.platform === 'win32' ? '.\\node_modules\\.bin\\format-package.cmd' : './node_modules/.bin/format-package',
				[ '--write', ...projects.map( p => normalizePath( resolve( p.path, 'package.json' ) ) ) ] );
		},
		handleFile: filename => /(\/|^)package\.json$/.test( filename ),
	};
};

const checksum = async file => createHash( 'md5' )
	.update( ( await readFile( file, 'utf-8' ) ).replace( /\r?\n/g, '\n' ), 'utf-8' )
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
				.split( /\r?\n/ )
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
		name: 'syncFs',
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
	 * @param {string} readmeContent
	 * @param {any} packageContent
	 */
	const replaceHeader = async ( readmeContent, packageContent ) => {
		let newHeader = `# ${packageContent.name}`;
		if( packageContent.description ){
			newHeader += `${EOL}${EOL}> ${packageContent.description}`;
		}
		const shield = ( label, suffix, link ) => `[![${label}](https://img.shields.io${suffix}?style=for-the-badge)](${link})`;
		newHeader += `${EOL}
${shield( 'npm version', `/npm/v/${packageContent.name}`, `https://www.npmjs.com/package/${packageContent.name}` )}
${shield( 'npm downloads', `/npm/dm/${packageContent.name}`, `https://www.npmjs.com/package/${packageContent.name}` )}
[![Compatible with TypeDoc](https://img.shields.io/badge/For%20typedoc-${packageContent.peerDependencies.typedoc}-green?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/typedoc)

---

${shield( 'CircleCI', '/circleci/build/github/KnodesCommunity/typedoc-plugins/main', 'https://circleci.com/gh/KnodesCommunity/typedoc-plugins/tree/main' )}
${shield( 'Code Climate coverage', '/codeclimate/coverage-letter/KnodesCommunity/typedoc-plugins', 'https://codeclimate.com/github/KnodesCommunity/typedoc-plugins' )}
${shield( 'Code Climate maintainability', '/codeclimate/maintainability/KnodesCommunity/typedoc-plugins', 'https://codeclimate.com/github/KnodesCommunity/typedoc-plugins' )}

For more infos, please refer to [the documentation](${getDocsUrl( packageContent )})`;
		newHeader = `<!-- HEADER -->
${newHeader}
<!-- HEADER end -->
`;
		const headerRegex = /^<!-- HEADER -->(.*)<!-- HEADER end -->(\r?\n|$)/sm;
		if( !headerRegex.test( readmeContent ) ){
			console.log( yellow( `Header not found in ${readmeContent}` ) );
		}
		return newHeader + readmeContent.replace( headerRegex, '' );
	};
	/**
	 * @param {string} readmeContent
	 * @param {any} packageContent
	 */
	const replaceInstall = async ( readmeContent, packageContent ) => {
		const typedocVer = packageContent.dependencies?.['typedoc'] ?? packageContent.peerDependencies?.['typedoc'];
		const devTypedocVer = packageContent.devDependencies?.['typedoc'];
		let newInstall = `
## Quick start

\`\`\`sh
npm install --save-dev ${packageContent.name}${typedocVer ? ` typedoc@${typedocVer}` : ''}
\`\`\``;
		if( typedocVer || devTypedocVer ){
			newInstall += `

## Compatibility`;
		}
		if( typedocVer ){
			newInstall += `

This plugin version should match TypeDoc \`${typedocVer}\` for compatibility.`;
		}
		if( devTypedocVer ){
			newInstall += `

> **Note**: this plugin version was released by testing against \`${devTypedocVer}\`.`;
		}
		newInstall = `<!-- INSTALL -->
${newInstall}

<!-- INSTALL end -->
`;
		const installRegex = /^<!-- INSTALL -->(.*)<!-- INSTALL end -->(\r?\n|$)/sm;
		if( !installRegex.test( readmeContent ) ){
			console.log( yellow( `Install not found in ${readmeContent}` ) );
			return `${readmeContent  }\n\n${newInstall}`;
		}
		return readmeContent.replace( installRegex, newInstall );
	};
	return {
		name: 'readme',
		run: async ( _proto, { path: projectPath } ) => {
			const readmeFiles = await globAsync( `${projectPath}/@(readme|README).@(md|MD)` );
			if( readmeFiles.length > 1 ){
				throw new Error( 'Multiple README files' );
			}
			const readmeFile = readmeFiles[0] ?? `${projectPath}/README.md`;
			const readmeContent = ( await tryReadFile( readmeFile, 'utf-8' ) ) ?? '';
			const { packageContent } = await readProjectPackageJson( projectPath );
			if( !packageContent ){
				throw new Error();
			}
			const result = await [ replaceHeader, replaceInstall ].reduce( async ( content, fn ) => {
				const c = await content;
				return fn( c, packageContent );
			}, Promise.resolve( readmeContent ) );
			await writeFile( readmeFile, result );
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
	const protoDir = normalizePath( resolve( __dirname, 'proto' ) );
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
			if( setup ){
				await setup( protoDir, projects, handlers );
			}
		}
		for( const { run } of handlers ){
			await Promise.all( projects.map( p => run( protoDir, p, handlers ) ) );
		}
		for( const { tearDown } of handlers ){
			if( tearDown ){
				await tearDown( protoDir, projects, handlers );
			}
		}
	} )();
}

