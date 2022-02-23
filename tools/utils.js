import { exec as _exec } from 'child_process';

export const exec = cmd => new Promise( ( res, rej ) => _exec( cmd, e => e ? rej( e ) : res() ) );
