import { JSX, PageEvent, Reflection } from 'typedoc';

import type { KnodesPluginsDemoThemeContext } from '../knodes-plugins-demo-theme-context';

export const navigation = ( context: KnodesPluginsDemoThemeContext ) => ( props: PageEvent<Reflection> ): JSX.Element =>
	<>
		{context.settings()}
		{context.pagesPlugin.pagesNavigation( props )}
		{context.primaryNavigation( props )}
		{context.secondaryNavigation( props )}
	</>;
