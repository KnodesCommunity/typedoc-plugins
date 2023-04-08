import chalk from 'chalk';
import { glob } from 'glob';

import { getDocsUrl, syncFile, tryReadFile } from './utils/index.mjs';

class Readme {
	constructor( checkOnly ){
		this.name = 'readme';
		this.checkOnly = checkOnly;
	}

	async run( _proto, { path: projectPath, pkgJson } ){
		const readmeFiles = await glob( `${projectPath}/@(readme|README).@(md|MD)` );
		if( readmeFiles.length > 1 ){
			throw new Error( 'Multiple README files' );
		}
		const readmeFile = readmeFiles[0] ?? `${projectPath}/README.md`;
		const readmeContent = ( await tryReadFile( readmeFile, 'utf-8' ) ) ?? '';
		const result = ( await [ this._replaceHeader, this._replaceInstall ].reduce( async ( content, fn ) => {
			const c = await content;
			return fn( c, pkgJson );
		}, Promise.resolve( readmeContent ) ) ).replace( /\r\n/g, '\n' );
		await syncFile( this.checkOnly, readmeFile, result );
	}

	handleFile( filename ) {
		return /(\/|^)readme\.md$/i.test( filename );
	}

	/**
	 * @param readmeContent
	 * @param packageContent
	 */
	async _replaceHeader( readmeContent, packageContent ){
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
${shield( 'Code Climate maintainability', '/codeclimate/maintainability/KnodesCommunity/typedoc-plugins', 'https://codeclimate.com/github/KnodesCommunity/typedoc-plugins' )}

For more infos, please refer to [the documentation](${getDocsUrl( packageContent )})`;
		newHeader = `<!-- HEADER -->
${newHeader}
<!-- HEADER end -->
`;
		const headerRegex = /^<!-- HEADER -->(.*)<!-- HEADER end -->(\r?\n|$)/sm;
		if( !headerRegex.test( readmeContent ) ){
			console.log( chalk.yellow( `Header not found in ${readmeContent}` ) );
		}
		return newHeader + readmeContent.replace( headerRegex, '' );
	}

	/**
	 * @param readmeContent
	 * @param packageContent
	 */
	async _replaceInstall( readmeContent, packageContent ){
		const typedocVer = packageContent.dependencies?.['typedoc'] ?? packageContent.peerDependencies?.['typedoc'];
		const devTypedocVer = packageContent.devDependencies?.['typedoc'];
		const newInstall = `<!-- INSTALL -->
## Quick start

\`\`\`sh
npm install --save-dev ${packageContent.name}${typedocVer ? ` typedoc@${typedocVer}` : ''}
\`\`\`
${( typedocVer || devTypedocVer ) && `
## Compatibility
`}${typedocVer && `
This plugin version should match TypeDoc \`${typedocVer}\` for compatibility.
`}${devTypedocVer && `
> **Note**: this plugin version was released by testing against \`${devTypedocVer}\`.
`}<!-- INSTALL end -->
`;
		const installRegex = /^<!-- INSTALL -->(.*)<!-- INSTALL end -->(\r?\n|$)/sm;
		if( !installRegex.test( readmeContent ) ){
			console.log( chalk.yellow( `Install not found in ${readmeContent}` ) );
			return `${readmeContent  }\n\n${newInstall}`;
		}
		return readmeContent.replace( installRegex, newInstall );
	}
}

export const readme = checkOnly => new Readme( checkOnly );
