<!-- markdownlint-disable fenced-code-language blanks-around-fences -->

Hello world

{@codeblock ./src/codeblock/src-test.json | Test inline codeblock from relative}
{@codeblock ~~:example-test.json | Test inline codeblock from project root}
{@codeblock ~:example-test.json | Test inline codeblock from module root}
{@inlineCodeblock example-inline.json ```json
{"hello": "world"}
```}

@codeblock ./examples/test.json | Test block codeblock
@inlineCodeblock example-inline.json ```json
{"hello": "world"}
```
