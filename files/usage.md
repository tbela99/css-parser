---
title: Usage
group: Documents
category: Guides
---

## Main function differences

| Function | Parses CSS | Generates CSS Output |
|----------|------------|----------------------|
| `parse()` | ✅ | ❌ |
| `render()` | ❌ | ✅
| `transform()` | ✅ | ✅ |

> **Note:** `parse()` only produce the AST and does not generate CSS output.

By contrast, `transform()` parses the CSS **and** generates the transformed CSS text. This is useful when you want the rendered CSS directly without performing a separate AST rendering step.

```ts
import {parse, render} from '@tbela99/css-parser';

const css = `...`;

const result = await parse(css); // or parse({input: css});
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

const result = await transform(css); // or transform({input: css});
console.debug(result.ast);
console.debug(result.code);
console.debug(result.stats);
````
## Parsing

Parsing converts input CSS into an **AST (Abstract Syntax Tree)**.

You can parse CSS in two ways:

- `parse()` – Parses CSS and returns an AST.
- `transform()` – Parses and generate CSS as part of the transformation process.

For more information about the available parsing options, see the TypeScript documentation for [`ParserOptions`](../interfaces/node.ParserOptions.html).

### Usage

```javascript
parse(css, parserOptions = {})
parse(parserOptions = {input: css})
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

console.log(result.ast);
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
render(ast, RenderOptions = {});
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

// print declaration without parents
console.error(render(result.ast.chi[0].chi[1].chi[1], {withParents: false}));
// -> width:3px

// print declaration with parents
console.debug(render(result.ast.chi[0].chi[1].chi[1], {withParents: true}));
// -> @media screen and (min-width:40em){.a{width:3px}}

```

### Pretty printing
By default, CSS output is minified. That behavior can be changed by passing the option `{beautify:true}`.

```ts

const result = await transform(css, {beautify: true}); 
// or render(ast, {beautify: true})

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


------
[← Getting started](./Guide.Getting_started.html) | [Validation →](./Guide.Validation.html) 

