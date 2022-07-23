import { Application } from 'typedoc';

import { KnodesPluginsDemoTheme } from './thene/knodes-plugins-demo-theme';

export const load = ( application: Application ) => {
	application.renderer.defineTheme( 'knodes-plugins-theme-demo', KnodesPluginsDemoTheme );
};
