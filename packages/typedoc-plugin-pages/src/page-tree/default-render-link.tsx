import { DefaultThemeRenderContext, JSX, RenderTemplate } from 'typedoc';

import { RenderPageLinkProps } from '../theme';

export const doRenderTemplate: RenderTemplate<RenderPageLinkProps & { context: DefaultThemeRenderContext }> =
	( { mapping, context, label } ): JSX.Element =>
		<a href={context.urlTo( mapping.model )}>{label ?? mapping.model.name}</a>;
