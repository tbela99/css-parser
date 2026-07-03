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

The library exposes three entry points:

- `@tbela99/css-parser` or `@tbela99/css-parser/node` which relies on node fs and fs/promises to read files
- `@tbela99/css-parser/cjs` same as the previous except it is exported as a commonjs module
- `@tbela99/css-parser/web` which relies on the web fetch api to read files

The default file loader can be overridden via the options [ParseOptions.load](../interfaces/node.ParserOptions.html#load) or [TransformOptions.load](../interfaces/node.TransformOptions.html#load) of parse() and transform() functions

### From the web browser

Load as javascript module

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

Load as an UMD module

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

------
[← Installation](./install.md) | [Parsing →](./parsing.md) 

