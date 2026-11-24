---
title: Usage
group: Documents
category: Guides
---

## Main function differences
The library offers two variants—synchronous and asynchronous functions—for parsing, analyzing, and transforming CSS.

The **synchronous API** is marginally faster than the asynchronous API, but it comes with some limitations. See the [details below](#difference-between-sync-and-async-apis).

| Function          | Parses CSS | Async | CSS Output |
| ----------------- | ---------- | ----- | ---------- |
| `parse()`         | ✅          | ✅     | ❌          |
| `parseSync()`     | ✅          | ❌     | ❌          |
| `transform()`     | ✅          | ✅     | ✅          |
| `transformSync()` | ✅          | ❌     | ✅          |
| `render()`        | ❌          | ❌     | ✅          |

> **Note:** `parse()` and `parseSync()` only produce the AST and do not generate CSS output.

By contrast, `transform()` and `transformSync()` parse the CSS **and** generate the transformed CSS text. This is useful when you want the rendered CSS directly without performing a separate AST rendering step.

### Usage

```ts
import {parse, render} from '@tbela99/css-parser';

const css = `...`;

const result = await parse(css); // or parse({input: css});
console.debug(result.ast); // the id of the stylesheet node in result.arena
console.debug(result.arena.toObject(result.ast)); // object view of the ast, printed as a plain object
console.debug(JSON.stringify(result.arena.toObject(result.ast))); // the ast as json
console.debug(result.stats);

const rendered = render(result.arena, result.ast);
console.debug(rendered.code);
console.debug(result.stats);
````

The ast nodes are allocated in an arena (`result.arena`) and referenced by their node id. See [Ast Manipulation](./ast.md).

or

```ts
import {transformSync} from '@tbela99/css-parser';

const css = `...`;

const result =  transformSync(css); // or transformSync({input: css});
console.debug(result.ast); // the id of the stylesheet node in result.arena
console.debug(result.code);
console.debug(result.stats);
````
## Parsing

Parsing converts input CSS into an **AST (Abstract Syntax Tree)**.

You can parse CSS in multiple ways:

- `parse()` or `parseSync()` – Parse CSS and returns an AST.
- `transform()` or `transformSync()` – Parse and generate CSS as part of the transformation process.

For more information about the available parsing options, see the TypeScript documentation for [`ParserOptions`](../interfaces/node.ParserOptions.html).

### Usage

```ts
parse(css, parserOptions = {})
parse(parserOptions = {input: css})
parse(parserOptions = {file: url_or_path})
```

### Example

````javascript
import {parse} from '@tbela99/css-parser';

const {ast, errors, stats} = await parse(css);
````

### Parsing files

The parse() and transform() functions can parse files.
They both accept a file url or path as first argument.

```ts
import {transform} from '@tbela99/css-parser';

const css = `https://docs.deno.com/styles.css`;

let result = await transform({file: css});
console.debug(result.code);

// load file as readable stream
result = await transform({file: css, asStream: true});
console.debug(result.code);
```

### Parsing from a Readable Stream

The parse() and transform() functions accept a string or readable stream as first argument.

```ts
import {parse} from '@tbela99/css-parser';
import {Readable} from "node:stream";

// usage: node index.ts < styles.css or cat styles.css | node index.ts

const readableStream = Readable.toWeb(process.stdin);
const result = await parse(readableStream, {beautify: true}); // or  parse({input: readableStream, beautify: true})

console.log(result.arena.toObject(result.ast));
```

A response body object can also be passed to parse() or transform() functions. 

```ts

import {transform} from '@tbela99/css-parser';

const response = await fetch(`https://docs.deno.com/styles.css`);
const result = await transform(response.body); // or parse(response.body)
console.debug(result.code);

```

## Rendering AST

For more information about the available transform options, see the TypeScript documentation for [`RenderOptions`](../interfaces/node.RenderOptions.html).

### Usage

```javascript
render(arena, ast, RenderOptions = {});
```

### Examples

Rendering ast

```javascript
import {parse, render} from '@tbela99/css-parser';

const css = `
@media screen and (min-width: 40em) {
    .featurette-heading {
        font-size: 50px;
    }
    .a {
        color: red;
        width: 3px;
    }
}
`;

const result = await parse(css, options);
const arena = result.arena;

// @media -> .a -> width
const declaration = arena.getChildAt(arena.getChildAt(arena.getChildAt(result.ast, 0), 1), 1);

// print declaration without parents
console.error(render(arena, declaration, {withParents: false}));
// -> width:3px

// print declaration with parents
console.debug(render(arena, declaration, {withParents: true}));
// -> @media screen and (min-width:40em){.a{width:3px}}

```

### Render result

`render()`, `transform()` and `transformSync()` return a [`RenderResult`](../classes/node.RenderResult.html) (a
[`TransformResult`](../classes/node.TransformResult.html) for the transform functions). The generated CSS is available
in two forms:

|                                   | `result.write`                                    | `result.code`                                                    |
|-----------------------------------|---------------------------------------------------|------------------------------------------------------------------|
| Type                              | `Uint8Array`: the CSS encoded as UTF-8            | `string`                                                         |
| How it is produced                | the render writes it: it is the output itself     | computed: decoded from `write` the first time it is read, then kept |
| Cost                              | none                                              | one decoding (UTF-8 to a JavaScript string) and the memory of the string |
| `postMessage()`, `structuredClone()` | copied, or moved with a transfer (see below)   | not sent: it is a getter, not a property of the object           |
| `JSON.stringify()`                | not serialized                                    | serialized                                                        |

`code` is dynamic: it does not exist until it is read. Reading it decodes `write`; a program that only writes the CSS
to a file, to the network or to another thread never creates the string.

`result.stats.bytesOut` is the length of the generated CSS (`result.code.length`), it is computed without decoding
the bytes.

The render buffer is allocated once, before rendering, from the length of the parsed CSS (`arena.inputLengths[ast]`,
imported files included) plus a small padding: the minified or beautified output is usually not larger than the input.
The buffer grows when the output is larger (beautifying minified CSS for instance). `result.write` contains only the
generated CSS: it is a view of the first bytes of that buffer (`result.write.buffer`), which is usually larger.

#### Writing the bytes

Files, sockets, HTTP responses and blobs accept bytes: use `result.write`, no string is created.

```javascript
// an HTTP response
new Response(result.write, {headers: {'content-type': 'text/css'}});

// string, decoded once, only when it is needed
console.debug(result.code);
```

#### Writing to a file

Write `result.write` as it is. The functions also accept the CSS as UTF-8 bytes: read the input file as bytes too, and
the CSS is never converted to a string, neither when it is read nor when it is written.

From node:

```javascript
import {transformSync} from '@tbela99/css-parser';
import {readFile, writeFile} from 'node:fs/promises';

// bytes in
const result = transformSync(await readFile('styles.css'));

// bytes out
await writeFile('styles.min.css', result.write);
```

To a stream (a file, an HTTP response, a socket):

```javascript
import {createWriteStream} from 'node:fs';

const stream = createWriteStream('styles.min.css');

stream.end(result.write);
```

From Deno and Bun:

```javascript
// deno
const result = transformSync(await Deno.readFile('styles.css'));
await Deno.writeFile('styles.min.css', result.write);

// bun
const result = transformSync(await Bun.file('styles.css').bytes());
await Bun.write('styles.min.css', result.write);
```

From the web browser: save the file with
[`showSaveFilePicker()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker) where it is
available (Chromium based browsers), download it otherwise. Call it from a click handler: both need a user gesture.

```javascript
async function save(result, name = 'styles.min.css') {

    if ('showSaveFilePicker' in window) {

        const handle = await showSaveFilePicker({
            suggestedName: name,
            types: [{description: 'CSS', accept: {'text/css': ['.css']}}]
        });

        const writable = await handle.createWritable();

        await writable.write(result.write);
        await writable.close();
        return;
    }

    const link = document.createElement('a');

    link.href = URL.createObjectURL(new Blob([result.write], {type: 'text/css'}));
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
}

button.addEventListener('click', () => save(transformSync(css)));
```

`result.write` is a view of the CSS only: the file contains `result.write.byteLength` bytes, not the whole render
buffer (`result.write.buffer`). `result.stats.bytesOut` counts the characters of the CSS (`result.code.length`): it is
smaller than the size of the file when the CSS contains non-ASCII characters.

#### Zero copy between threads

`result.write` is the form to send to another thread (a web worker, a node worker thread). Put its buffer in the
transfer list of `postMessage()`: the bytes are moved to the other thread, not copied, whatever the size of the CSS.
The CSS can be sent to the worker the same way: the functions accept the CSS as UTF-8 bytes.

`worker.js`: the minifier runs in the worker. The example uses a bundler (`new URL('./worker.js', import.meta.url)`,
package names): without one, import the url of the module, e.g.
`https://unpkg.com/@tbela99/css-parser@2.3.1/dist/web.js` (a worker does not use the import map of the page).

```javascript
// the handler is set before the library is loaded: a message received while the library loads is not lost
const library = import('@tbela99/css-parser/web');

self.onmessage = async ({data}) => {

    const {transformSync} = await library;

    // data: the CSS, as UTF-8 bytes
    const result = transformSync(data);

    // the bytes are moved to the main thread. result.code is never read: no string is created
    self.postMessage({css: result.write, errors: result.errors, stats: result.stats}, [result.write.buffer]);
};
```

`main.js`: the page sends the CSS and applies the result.

```javascript
const worker = new Worker(new URL('./worker.js', import.meta.url), {type: 'module'});

worker.onmessage = ({data}) => {

    // the bytes are used as they are: a stylesheet url, no decoding
    const link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = URL.createObjectURL(new Blob([data.css], {type: 'text/css'}));
    document.head.append(link);

    // or a string, when it is needed: new TextDecoder().decode(data.css)
};

const input = new TextEncoder().encode(css);

// the input is moved to the worker as well
worker.postMessage(input, [input.buffer]);
```

What to know:

- A transferred buffer is moved: the sending thread cannot use it any more. In the worker, `result.write` is empty after
  the transfer, and `result.code`, if it was not read before, is an empty string. Read `code` before the transfer when
  the worker needs the string too.
- Without a transfer list, `postMessage()` copies the whole buffer of `result.write`, including the unused bytes at its
  end. To copy only the CSS, send `result.write.slice()`.
- Send `result.write`, not the result: a cloned result has no `code` (it is a getter), and its `arena` is a plain
  object that the library cannot use.
- Set the message handler before the library is loaded, as above. The library is loaded with a top-level `await` (the
  [WebAssembly build](./wasm.md) downloads its module): with a static `import`, a message that arrives during the load
  finds no handler and is lost.
- The [native build](./native.md) returns `write` as a view of memory owned by the addon: it cannot be transferred
  (`postMessage()` throws a `DataCloneError`). Send `result.write.slice()` in the transfer list: one copy, of the CSS
  only. The [WebAssembly build](./wasm.md) and the TypeScript library return a buffer that can be transferred.

### Pretty printing
By default, CSS output is minified. That behavior can be changed by passing the option `{beautify:true}`.

```ts

const result = await transform(css, {beautify: true}); 
// or render(arena, ast, {beautify: true})

console.log(result.code);

```

### Preserving license comments

By default all comments are removed from the output. They can be preserved by passing the `{removeComments:false}` option,

If you only want to preserve license comments, and remove other comments, you can pass `{preserveLicense:true}` instead.

```ts

const css = `/*!
 * Bootstrap  v5.3.3 (https://getbootstrap.com/)
 * Copyright 2011-2024 The Bootstrap Authors
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */
[data-bs-theme=dark] {
 color-scheme: dark;
 
 ...`;

const result = await transform(css, {preserveLicense: true}); 
```

### Converting colors

Color conversion is controlled by the `convertColor` option. Colors are converted to the HEX format by default.
That behavior can be changed by passing the desired color type to the convertColor option:

- ColorType.HEX
- ColorType.RGB or ColorType.RGBA
- ColorType.HSL or ColorType.HSLA
- ColorType.HWB or ColorType.HWBA
- ColorType.CMYK or ColorType.DEVICE_CMYK
- ColorType.SRGB
- ColorType.SRGB_LINEAR
- ColorType.DISPLAY_P3
- ColorType.DISPLAY_P3_LINEAR
- ColorType.PROPHOTO_RGB
- ColorType.A98_RGB
- ColorType.REC2020
- ColorType.XYZ or ColorType.XYZ_D65
- ColorType.XYZ_D50
- ColorType.LAB
- ColorType.LCH
- ColorType.OKLAB
- ColorType.OKLCH

```ts
import {transform, ColorType} from '@tbela99/css-parser';

const css = `
.color-map {

color: lab(from #123456 calc(l + 10) a b);
background-color: lab(from hsl(180 100% 50%) calc(l - 10) a b);
}
`;
const result = await transform(css, {
    beautify: true,
    convertColor: ColorType.RGB,
    computeCalcExpression: true
});

console.log(result.code);

// .color-map {
//     color: rgb(45 74 111);
//     background-color: rgb(0 226 226)
// }
```

## Transform

The transform function parses and renders CSS. For more information about the available transform options, see the TypeScript documentation for [`TransformOptions`](../interfaces/node.TransformOptions.html).

### TransformOptions

Include ParserOptions and RenderOptions

### Example

```javascript
import {transform} from '@tbela99/css-parser';

const {ast, code, map, errors, stats} = await transform(css, {minify: true, resolveImport: true, cwd: 'files/css'});
```

### Example

Read from stdin with node using readable stream

```typescript
import {transform} from '@tbela99/css-parser';
import {Readable} from "node:stream";
import type {TransformResult} from '@tbela99/css-parser';

const readableStream: ReadableStream<string> = Readable.toWeb(process.stdin) as ReadableStream<string>;
const result: TransformResult = await transform(readableStream, {beautify: true});

console.log(result.code);
```

### Expand CSS nesting rules

Convert css nesting rules to legacy syntax.

```typescript
import {transform} from '@tbela99/css-parser';

const css = `
table.colortable {
    & td {
        text-align: center;

        &.c {
            text-transform: uppercase
        }

        &:first-child, &:first-child + td {
            border: 1px solid #000
        }
    }

    & th {
        text-align: center;
        background: #000;
        color: #fff
    }
}`;

result = await transform(css, {

    beautify: true,
    expandNestingRules: true
    }

});

console.log(result.code);
```

output

```css

table.colortable td {
    text-align: center;
}

table.colortable td.c {
    text-transform: uppercase;
}

table.colortable td:first-child, table.colortable td:first-child + td {
    border: 1px solid black;
}

table.colortable th {
    text-align: center;
    background: black;
    color: white;
}
```

### CSS if() function expansion

Convert CSS if() to legacy syntax.

```typescript

import {transform} from '@tbela99/css-parser';

const css = `
button {
	background: linear-gradient(
		if(media(min-width: 768px): to right; else: to bottom),
		if(style(--dark-mode): #333; else: #fff),
		if(style(--dark-mode): #000; else: #ccc)
	);
}`;

result = await transform(css, {

    beautify: true,
    expandIfSyntax: true
    }
});

console.log(result.code);
```

output

```css
button {
 background: linear-gradient(to bottom,#fff,#ccc);
 @media (min-width:768px) {
  background: linear-gradient(to right,#fff,#ccc);
  @container style(--dark-mode) {
   background: linear-gradient(to right,#333,#000)
  }
 }
 @container style(--dark-mode) {
  background: linear-gradient(to bottom,#333,#000)
 }
}
```

## Difference Between Sync and Async APIs

### Parsing features comparison

| Feature                 | parse() | transform() | transformSync() | ParseSync() |
| ----------------------- | ------- | ----------- | --------------- | ----------- |
| Parse from stream       | ✅       | ✅           | ❌               | ❌           |
| Parse from file         | ✅       | ✅           | ❌               | ❌           |
| Flatten @import at-rule | ✅       | ✅           | ❌               | ❌           |
| load css files          | ✅       | ✅           | ❌               | ❌           |

### CSS Module features comparison

| Feature                                                              | parse() | transform() | transformSync() | ParseSync() |
| -------------------------------------------------------------------- | ------- | ----------- | --------------- | ----------- |
| Algorithms supported by `pattern`: <br> sha1, sha256, sha384, sha512 | ✅       | ✅           | ❌               | ❌           |
| CSS `composes` from file                                             | ✅       | ✅           | ❌               | ❌           |
| import CSS variables from file                                       | ✅       | ✅           | ❌               | ❌           |

## Minification performance vs execution speed

`css-parser` is designed for maximum minification performance, but the optimal configuration depends on what matters most for your workload.
 
The parser provides settings that let you choose the balance between minification performance and execution speed:

- Minification performance: prioritize the quality and efficiency of the minification process, allowing the parser to perform additional work when generating the minimized output.

- Execution speed: minimize the amount of work performed during parsing and minification to achieve the fastest possible execution time.

However, the available settings allow you to shift the balance toward execution speed when minimizing runtime is more important than performing every available minification optimization.

The example below demonstrates a balanced configuration that improves execution speed by disabling advanced minification features.

```ts

import {transformSync} from "@tbela99/css-parser";

const css = `...`;

const result = transformSync({
                  input: css,
                  minify: false,
                  beautify: false,
                  removeEmpty: true,
                  removeComments: true,
                  convertColor: true,
                  minifyValues: true,
                });

console.debug(result.code);
console.debug(result.stats);
```

The measures of both settings, and a comparison with lightningcss and esbuild, are on the
[Performance](./performance.md) page.

------
[← Performance](./performance.md) | [Architecture →](./Guide.Architecture.html) 

