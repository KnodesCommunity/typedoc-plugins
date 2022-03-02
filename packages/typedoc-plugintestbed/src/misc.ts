import { html as beautifyHtml } from 'js-beautify';

export const formatHtml = ( v: string ): string => beautifyHtml( v, { indent_with_tabs: true } );
