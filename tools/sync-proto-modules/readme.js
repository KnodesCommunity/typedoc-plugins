const assert = require( 'assert' );
const { writeFile } = require( 'fs/promises' );
const { EOL } = require( 'os' );

const { yellow } = require( 'chalk' );

const { globAsync } = require( '../utils' );
const { tryReadFile, getDocsUrl, readProjectPackageJson } = require( './utils' );

/**
 * @param {boolean} checkOnly
 * @returns {import('./utils').ProtoHandler}
 */
module.exports.readme = checkOnly => {
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
			if( checkOnly ){
				assert.equal( result, readmeContent, `Readme ${readmeFile} does not match prototype` );
			} else {
				await writeFile( readmeFile, result );
			}
		},
		handleFile: filename => /(\/|^)readme\.md$/i.test( filename ),
	};
};
