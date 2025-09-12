---
title: Getting started
group: Documents
slug: /install
category: Guides
---

## Installation

### From npm

```shell
$ npm install @tbela99/css-parser
```

### From jsr

```shell
$ deno add @tbela99/css-parser
```
### As web module

the library can be imported as a module in the browser

```html
<script type="module">

    import {transform, ColorType} from 'https://esm.sh/@tbela99/css-parser@1.3.2/web';

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

    console.debug(await transform(css, {beautify: true, convertColor:.ColorType.OKLCH}).then(r => r.code));
    })();
</script>
```

it can also be imported as umd module

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
