import format from 'format-package';

export const formatPackage = async content => {
	if( typeof content === 'string' ){
		content = JSON.parse( content );
	}
	return format.default( content, {} );
};
