import { DefaultTheme, JSX, RenderTemplate } from 'typedoc';

import { RenderPageLinkProps } from '../theme';

export const fallbackRenderPageLink: RenderTemplate<RenderPageLinkProps & { theme: DefaultTheme }> =
	( { mapping, theme: { markedPlugin }, label } ): JSX.Element =>
		<a href={markedPlugin.getRelativeUrl( mapping.url )}>{label ?? mapping.model.originalName}</a>;
