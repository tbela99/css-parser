---
title: Getting started
group: Documents
category: Guides
---

## Getting started

CSS-Parser is a high-performance, fault-tolerant, and dependency-free all-in-one CSS parsing solution for Node.js and browsers.

It implements the [CSS Syntax Module Level 3](https://www.w3.org/TR/css-syntax-3/) specification and validates CSS using the syntax definitions of the W3C specifications from [@webref/css](https://github.com/w3c/webref/tree/main/packages/css). Every stylesheet is fully parsed into a structured AST, and token values are exposed as typed data so the library can support robust transformations, validation, and plugin-oriented workflows without falling back to raw strings.

In addition to parsing and validation, CSS-Parser provides advanced optimization and minification capabilities. According to [this benchmark](https://tbela99.github.io/css-parser/benchmark/index.html), it is the most efficient CSS minifier available, producing smaller output than competing solutions while maintaining competitive performance.

## Playground

Want to see it in action? Try the [CSS-Parser playground](https://tbela99.github.io/css-parser/playground/).

## Features

A non-exhaustive list of features is provided below:


* **Zero dependencies** — lightweight and easy to integrate into any project.
* **All-in-one CSS parsing solution** for parsing, validation, transformation, and minification.
* **Standards-based CSS validation** powered by the W3C specification definitions ([@webref/css](https://github.com/w3c/webref/tree/main/packages/css)).
* **Full CSS Modules support** for modern component-based workflows.
* **Fault-tolerant parsing** that follows the CSS Syntax Module Level 3 specification and always yields a complete parse tree.
* **Typed tokens and AST** — parsed CSS is exposed as strongly typed tokens and nodes for safer plugin and transform logic.
* **High-performance minification** with safe optimizations and no unsafe transforms.
* **Advanced color processing** with support for modern color spaces and functions, including `color()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color-mix()`, `light-dark()`, system colors, and relative colors.
* **Color conversion engine** capable of transforming colors between all supported formats.
* **Automatic CSS nesting generation** from compatible selectors.
* **Nested CSS transpilation** to legacy-compatible syntax.
* **`if()` function transpilation** for broader browser compatibility.
* **Source map generation** for easier debugging and development workflows.
* **Shorthand property computation** to reduce output size and improve optimization.
* **Transform function optimization** for more compact CSS output.
* **Math function evaluation**, including `calc()`, `clamp()`, `min()`, `max()`, and related expressions.
* **CSS variable inlining** where values can be safely resolved.
* **Duplicate declaration removal** to eliminate redundant rules.
* **`@import` flattening** to produce self-contained stylesheets.
* **Vendor prefix cleanup** to modernize generated CSS.
* **Binary input** — the css can be a string, an `ArrayBuffer` or an `ArrayBufferView` (utf-8 bytes, `Uint8Array`, `Buffer`): an ASCII buffer is tokenized without copy.
* **Experimental**: evaluate @mixin and @function
* **51.5kb** once minified and gzipped.

## Installation

### From NPM

```shell
$ npm install @tbela99/css-parser
```

### From JSR

```shell
$ deno add @tbela99/css-parser
```
### As Web module

It can be imported as an umd module.

```html
<script type="module">

    import {transformSync, ColorType} from 'https://unpkg.com/@tbela99/css-parser@2.3.2/web';

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

    console.debug(transformSync(css, {beautify: true, convertColor: ColorType.OKLCH}).code);
</script>
```

### As UMD module

It can be imported as a module in the browser.

```html

<script src="https://unpkg.com/@tbela99/css-parser@2.3.2/dist/index-umd-web.js"></script>
<script>

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

    console.debug(CSSParser.transformSync(css, {beautify: true, convertColor: CSSParser.ColorType.OKLCH}).code);

</script>
```

## From node, bun or deno

```ts

import {transformSync, ColorType} from '@tbela99/css-parser';

const css = `

.ruler {

    height: 10px;
    background-color: orange
}
.hsl { color: #b3222280; }
`;

const result = transformSync(css, {

    beautify: true,
    convertColor: ColorType.SRGB
});

console.debug(result.code);
```

The library exposes two entry points:

- `@tbela99/css-parser` or `@tbela99/css-parser/node` which relies on node fs and fs/promises to read files
- `@tbela99/css-parser/web` which relies on the web fetch api to read files

The library is an ES module. The deprecated commonjs entry point (`@tbela99/css-parser/cjs`) is removed in 2.0.0: use
`import` (or a dynamic `import()` in a commonjs module, see [Migration](./migration.md)).

## From the web browser

Load as javascript module

```html
<script type="module">

    import {transformSync, ColorType} from 'https://unpkg.com/@tbela99/css-parser@2.3.2/web';

const css = `

.ruler {

    height: 10px;
    background-color: orange
}
.hsl { color: #b3222280; }
`;

const result = transformSync(css, {

    beautify: true,
    convertColor: ColorType.RGB
});

console.debug(result.code);

</script>
```

Load as an UMD module

```html

<script src="https://unpkg.com/@tbela99/css-parser@2.3.2/dist/index-umd-web.js"></script>
<script>

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

    console.debug(CSSParser.transformSync(css, {beautify: true, convertColor: CSSParser.ColorType.OKLCH}).code);

</script>
```


------
[← Index](./index.md) | [Native build →](./native.md) 