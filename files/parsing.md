---
title: Parsing
group: Documents
category: Guides
---

## Parsing CSS

### Parsing

Parsing will turn the input css into an AST (Abstract Syntax Tree). It is achieved using the functions `parse()` and `transform()` or by using the corresponding functions `parseFile()` and `transformFile()`. `parse()` and `parseFile()` will not produce any css. To the contrary, the `transform()` and `transformFile()` functions will parse and also produce the CSS code, which comes handing if you do not want an additional step to render the ast.

```ts
import {parse, render} from '@tbela99/css-parser';

const css = `...`;

const result = await parse(css);
console.debug(result.ast);
console.debug(result.stats);

const rendered = render(result.ast);
console.debug(rendered.code);
console.debug(result.stats);
````

or

```ts
import {transform} from '@tbela99/css-parser';

const css = `...`;

const result = await transform(css);
console.debug(result.ast);
console.debug(result.code);
console.debug(result.stats);
````

### Parsing files

The parseFile() and transformFile() functions can be used to parse files.
They both accept a file url or path as first argument.

```ts
import {transformFile} from '@tbela99/css-parser';

const css = `https://docs.deno.com/styles.css`;

let result = await transformFile(css);
console.debug(result.code);

// load file as readable stream
result = await transformFile(css, true);
console.debug(result.code);
```

### Parsing from a Readable Stream

The parse() and transform() functions accept a string or readable stream as first argument.

```ts
import {parse} from '@tbela99/css-parser';
import {Readable} from "node:stream";

// usage: node index.ts < styles.css or cat styles.css | node index.ts

const readableStream = Readable.toWeb(process.stdin);
const result = await parse(readableStream, {beautify: true});

console.log(result.ast);
```

A response body object can also be passed to parseFile() or transformFile() functions

```ts

import {transformFile} from '@tbela99/css-parser';

const response = await fetch(`https://docs.deno.com/styles.css`);
const result = await transformFile(response.body); // or parse(response.body)
console.debug(result.code);

```

### Parsing Options

See [ParserOptions](../interfaces/node.ParserOptions.html)

------
[← Usage](../documents/Guide.Usage.html) | [Rendering →](../documents/Guide.Rendering.html) 

