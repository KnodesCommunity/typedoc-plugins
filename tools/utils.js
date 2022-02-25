const { exec: _exec } = require( 'child_process' );

module.exports.exec = cmd => new Promise( ( res, rej ) => _exec( cmd, e => e ? rej( e ) : res() ) );
