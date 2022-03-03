import { JSDOM } from 'jsdom';

export const formatExpanded = ( file: string, content: string ) => `<details class="code-block" open=""><summary><p>From ${file}</p></summary>${content}\n</details>`;
export const checkDef = ( dom: JSDOM, id: string, codeBlock: string ) => {
	const link = dom.window.document.getElementById( id );
	expect( link ).toBeTruthy();
	const section = link!.parentElement;
	expect( section ).toBeTruthy();
	const blocks = section!.querySelectorAll( '.code-block' );
	expect( blocks ).toHaveLength( 1 );
	const block = blocks[0]!;
	expect( block.outerHTML ).toEqual( codeBlock );
};
