export const formatExpanded = ( file: string, content: string ) => `<details class="code-block" open=""><summary>
<p>From ${file}</p></summary>
${content}
</details>`;

export const simpleJson = ( key: string, value: string ) => '<pre><code class="language-json">' +
`<span class="hl-0">{</span><span class="hl-1">${key}</span><span class="hl-0">: </span><span class="hl-2">${value}</span><span class="hl-0">}</span>
</code></pre>`;
