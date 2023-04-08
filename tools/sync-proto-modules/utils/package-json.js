const format = require( 'format-package' ).default;

module.exports.formatPackage = async content => {
	if( typeof content === 'string' ){
		content = JSON.parse( content );
	}
	return format( content, {} );
};
