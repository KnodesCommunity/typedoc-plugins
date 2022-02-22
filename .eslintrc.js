const { resolve, dirname, relative } = require( 'path' );

const { sync } = require( 'glob' );
const packagesWithEslintrc = sync( './packages/**/.eslintrc.js' );
module.exports = {
	root: true,
	extends: '@knodes/eslint-config/js',
	env: { node: true },
	overrides: packagesWithEslintrc
		.map( p => {
			const required = { ...require( p ) };
			delete required.root;
			return ( {
				files: [ relative( process.cwd(), resolve( dirname( p ), '**/*' ) ) ],
				...required,
			} );
		} ),
};
