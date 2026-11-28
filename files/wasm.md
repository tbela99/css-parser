---
title: WebAssembly build
group: Documents
category: Guides
---

## Web assembly build

`@tbela99/rust-css-parser-wasm` is the WebAssembly build of CSS-Parser: the library ported to Rust and compiled to
WebAssembly. It has the same API as `@tbela99/css-parser`, produces the same output, and runs in Node.js and in the
browsers without a native addon.

It is faster than the TypeScript library and slower than the [native build](./native.md):

| Package | Runs in | Speed |
|---------|---------|-------|
| [`@tbela99/rust-css-parser-napi`](./native.md) | Node.js on macOS and Linux | the fastest |
| `@tbela99/rust-css-parser-wasm` | Node.js, the browsers | faster than TypeScript, slower than N-API |

The source code is in the [rust-css-parser](https://github.com/tbela99/rust-css-parser) repository.

## Performance

The WebAssembly build is up to 1.9 times faster than the TypeScript library, with the same output. See
[Performance](./performance.md) for the measures and a comparison with lightningcss and esbuild.

## Installation

### From NPM

```shell
$ npm install @tbela99/rust-css-parser-wasm
```

### From JSR

```shell
$ deno add jsr:@tbela99/rust-css-parser-wasm
# or, from node
$ npx jsr add @tbela99/rust-css-parser-wasm
```

With npm 12 or later, `npx jsr add` needs `npm_config_allow_remote=all`: npm refuses the JSR tarballs, served from
another host, by default.

From Deno, the WebAssembly module is fetched from jsr.io when the package is imported: allow it with
`deno run --allow-net=jsr.io`.

No toolchain is needed: the package contains the compiled WebAssembly module (`dist/css_parser.wasm`, 2 MB).

## Usage

### From node

```javascript
import { transformSync, ColorType } from "@tbela99/rust-css-parser-wasm";

const result = transformSync(`.ruler { height: 10px; background-color: orange } .hsl { color: #b3222280 }`, {
    beautify: true,
    convertColor: ColorType.SRGB,
});

console.debug(result.code);
```

### From the web browser

A page that minifies the css typed in a textarea. The package is loaded from a CDN, as a JavaScript module: the
WebAssembly module is fetched when the import is evaluated, then `transformSync()` runs synchronously.

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>CSS minifier</title>
</head>
<body>
<textarea id="input" rows="10" cols="80">
.ruler {
    height: 10px;
    background-color: orange;
}
.hsl { color: hsl(0 66.67% 41.76% / .5); width: calc(10px + 2px) }
</textarea>
<p><button id="minify">Minify</button> <span id="stats"></span></p>
<pre id="output"></pre>

<script type="module">
    import {transformSync, ColorType} from 'https://unpkg.com/@tbela99/rust-css-parser-wasm@2.3.3/dist/web.js';

    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const stats = document.getElementById('stats');

    function minify() {
        const result = transformSync(input.value, {
            convertColor: ColorType.HEX
        });

        output.textContent = result.code;
        stats.textContent = `${result.stats.bytesIn} → ${result.stats.bytesOut} bytes, ${result.stats.total}`;
    }

    document.getElementById('minify').addEventListener('click', minify);
    minify();
</script>
</body>
</html>
```

The output of the default css is `.ruler{height:10px;background-color:orange}.hsl{color:#b1232380;width:12px}`.

#### With an import map

An [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) maps the
name of the package to its url: the modules import `@tbela99/rust-css-parser-wasm`, as in node.

```html
<script type="importmap">
    {
        "imports": {
            "@tbela99/rust-css-parser-wasm": "https://unpkg.com/@tbela99/rust-css-parser-wasm@2.3.3/dist/web.js"
        }
    }
</script>
<script type="module">
    import {transformSync, ColorType} from '@tbela99/rust-css-parser-wasm';

    console.debug(transformSync('.a { color: rgb(255 0 0) } .a { width: calc(1px + 2px) }').code);
    // .a{color:red;width:3px}
</script>
```

#### Hosting the package

The WebAssembly module is fetched next to the JavaScript modules (`new URL("./css_parser.wasm", import.meta.url)`).
To host the package yourself, serve the whole `dist/` directory of the package, e.g.
`node_modules/@tbela99/rust-css-parser-wasm/dist/`, and import its `web.js`. The server must send `css_parser.wasm`
with the `application/wasm` content type.

### Entry points

- `@tbela99/rust-css-parser-wasm`: the Node.js entry point in Node.js, the browser entry point elsewhere
- `@tbela99/rust-css-parser-wasm/node`: relies on node fs and fs/promises to read files, like `@tbela99/css-parser/node`
- `@tbela99/rust-css-parser-wasm/web`: relies on the web fetch api to read files, like `@tbela99/css-parser/web`

The WebAssembly module is loaded when the package is imported (top-level `await`).

## Differences with the TypeScript library

- Same API: the same exports, options and results, and the same output.
- The package is an ES module: there is no UMD build (`index-umd-web.js`). Load it with `<script type="module">`.
- In a web worker, set the message handler before the package is loaded: the WebAssembly module is downloaded with a
  top-level `await`, and a message received during the download is lost otherwise. `result.write` can be transferred
  back to the page without a copy, see [Zero copy between threads](./usage.md#zero-copy-between-threads).
- The download is larger: 2 MB for the WebAssembly module (775 KB for the whole npm package, compressed). The
  TypeScript library is 51.5 KB minified and gzipped.
- The AST lives in the WebAssembly memory: the nodes are views of the arena columns, read when their properties are
  accessed (see [Arena Memory](./arena.md)).
- Do not mix the builds: an AST parsed by `@tbela99/rust-css-parser-wasm` must be rendered and transformed by
  `@tbela99/rust-css-parser-wasm`. Passed to `@tbela99/css-parser` or to `@tbela99/rust-css-parser-napi`, it throws or
  renders an empty string.

------
[← Native build](./native.md) | [Rust crate →](./rust.md)
