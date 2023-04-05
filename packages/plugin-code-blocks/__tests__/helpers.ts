import { readFileSync } from 'fs';

import { escapeRegExp } from 'lodash';

export const formatExpanded = ( file: string, content: string ) => `<details class="code-block" open=""><summary>
<p>From ${file}</p></summary>
${content}
</details>`;

export const simpleJson = ( key: string, value: string ) => '<pre><code class="language-json">' +
`<span class="hl-0">{</span><span class="hl-1">${key}</span><span class="hl-0">: </span><span class="hl-2">${value}</span><span class="hl-0">}</span>
</code></pre>`;

export const matchExpanded = ( file: string, content: string ) => ( element: Element ) => {
	expect( element.outerHTML ).toMatch( new RegExp( `\
${escapeRegExp( `<details class="code-block" open=""><summary>
<p>From ${file}</p></summary>` )}\
.*\
${escapeRegExp( '</details>' )}`, 's' ) );
	expect( element.querySelector( 'pre' ) ).toHaveTextContent( content );
	return true;
};
export const matchFileExpanded = ( file: string, src: string ) => {
	const content = readFileSync( src, 'utf-8' );
	return matchExpanded( file, content );
};
