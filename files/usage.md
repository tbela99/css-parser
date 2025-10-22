---
title: Usage
group: Documents
category: Guides
---

## Usage

### From node, bun or deno

```ts

import {transform, ColorType} from '@tbela99/css-parser';

const css = `

.ruler {

    height: 10px;
    background-color: orange
}
.hsl { color: #b3222280; }
`;

const result = await transform(css, {

    beautify: true,
    convertColor: ColorType.SRGB
});

console.debug(result.code);
```

the library exposes three entry points

- `@tbela99/css-parser` or `@tbela99/css-parser/node` which relies on node fs and fs/promises to read files
- `@tbela99/css-parser/cjs` same as the previous except it is exported as a commonjs module
- `@tbela99/css-parser/web` which relies on the web fetch api to read files

the default file loader can be overridden via the options [ParseOptions.load](../interfaces/node.ParserOptions.html#load) or [TransformOptions.load](../interfaces/node.TransformOptions.html#load) of parse() and transform() functions

### From the web browser

load as javascript module

```html
<script type="module">

    import {transform, ColorType} from 'https://esm.sh/@tbela99/css-parser@1.3.2/web';

const css = `

.ruler {

    height: 10px;
    background-color: orange
}
.hsl { color: #b3222280; }
`;

const result = await transform(css, {

    beautify: true,
    convertColor: ColorType.RGB
});

console.debug(result.code);

</script>
```

load as umd module

```html

<script src="https://unpkg.com/@tbela99/css-parser@1.3.2/dist/index-umd-web.js"></script>
<script>

    (async () => {

        const css = `

.table {
    border-collapse: collapse;
    width: 100%;
}

.table td, .table th {
    border: 1px solid #ddd;
    padding: 8px;
}

.table tr:nth-child(even){background-color: #f2f2f2;}

.table tr:hover {background-color: #ddd;}

.table th {
    padding-top: 12px;
    padding-bottom: 12px;
    text-align: left;
    background-color: #4CAF50;
    color: white;
}
    `;

        console.debug(await CSSParser.transform(css, {beautify: true, convertColor: CSSParser.ColorType.OKLCH}).then(r => r.code));
    })();

</script>
```

### Parsing

parsing is achieved using the parse() or transform() function. the transform() function will also provide the css code as a result which comes handing if you do not want an additional step of rendering the ast.

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

the parseFile() and transformFile() functions can be used to parse files.
they both accept a file url or path as first argument.

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

the parse() and transform() functions accept a string or readable stream as first argument.

```ts
import {parse} from '@tbela99/css-parser';
import {Readable} from "node:stream";

// usage: node index.ts < styles.css or cat styles.css | node index.ts

const readableStream = Readable.toWeb(process.stdin);
const result = await parse(readableStream, {beautify: true});

console.log(result.ast);
```

a response body object can also be passed to parseFile() or transformFile() functions

```ts

import {transformFile} from '@tbela99/css-parser';

const response = await fetch(`https://docs.deno.com/styles.css`);
const result = await transformFile(response.body); // or parse(response.body)
console.debug(result.code);

```
### Rendering css

[rendering options](../interfaces/node.RenderOptions.html) can be passed to both transform() and render() functions.

#### Pretty printing
by default css output is minified. that behavior can be changed by passing the `{beautify:true}` option.

```ts

const result = await transform(css, {beautify: true}); 
// or render(ast, {beautify: true})

console.log(result.code);

```

#### Preserving license comments

by default all comments are removed. they can be preserved by passing the `{removeComments:false}` option,

if you only want to preserve license comments, and remove other comments, you can pass `{preserveLicense:true}` instead.

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

#### Converting colors

color conversion is controlled by the `convertColor` option. colors are converted to the HEX format by default.
that behavior can be changed by passing the chosen color type to the convertColor option:

- ColorType.HEX
- ColorType.RGB or ColorType.RGBA
- ColorType.HSL or ColorType.HSLA
- ColorType.HWB or ColorType.HWBA
- ColorType.CMYK or ColorType.DEVICE_CMYK
- ColorType.SRGB
- ColorType.SRGB_LINEAR
- ColorType.DISPLAY_P3
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
.

------
[← Getting started](../../docs/documents/Guide.Getting_started.html) | [Minification →]( ../../docs/documents/Guide.Minification.html )

