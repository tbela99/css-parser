---
title: Native build (N-API)
group: Documents
category: Guides
---

## Native build

`@tbela99/rust-css-parser-napi` is the native build of CSS-Parser: the library ported to Rust, loaded by Node.js as an
[N-API](https://nodejs.org/api/n-api.html) addon. It has the same API as `@tbela99/css-parser` and produces the
same output, faster.

Two Rust builds are available:

| Package | Runs in | Speed |
|---------|---------|-------|
| `@tbela99/rust-css-parser-napi` | Node.js on macOS and Linux | the fastest |
| [`@tbela99/rust-css-parser-wasm`](./wasm.md) | Node.js, the browsers | faster than TypeScript, slower than N-API |

The source code is in the [rust-css-parser](https://github.com/tbela99/rust-css-parser) repository.

## Performance

The N-API build is the fastest build: up to 2.1 times faster than the TypeScript library, with the same output. See
[Performance](./performance.md) for the measures and a comparison with lightningcss and esbuild.

## Installation

### From NPM

```shell
$ npm install @tbela99/rust-css-parser-napi
```

The package does not contain a binary: the addon is built from the Rust sources of the package when it is installed.

- Requirements: macOS or Linux, Node.js 22 or later and the [Rust toolchain](https://rustup.rs) (`cargo`).
- The build takes about a minute. The build directory is removed afterwards.
- npm versions that block install scripts need an approval first:

```shell
$ npm install-scripts approve @tbela99/rust-css-parser-napi
$ npm rebuild @tbela99/rust-css-parser-napi
```

- pnpm: allow the build of the package in `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  "@tbela99/rust-css-parser-napi": true
```

- The addon can also be built by hand: `node install.js` in the directory of the package.

### From JSR

```shell
$ npx jsr add @tbela99/rust-css-parser-napi
$ node node_modules/@tbela99/rust-css-parser-napi/install.js
```

JSR does not run install scripts: the second command builds the addon (same requirements as above). With npm 12 or
later, `npx jsr add` needs `npm_config_allow_remote=all`: npm refuses the JSR tarballs, served from another host, by
default.

On Windows, or without a Rust toolchain, use the [WebAssembly build](./wasm.md).

## Usage

Replace the name of the package in the imports: the functions, the options, the enums and the results are the same.

```javascript
import { transformSync, ColorType } from "@tbela99/rust-css-parser-napi";

const result = transformSync(`.ruler { height: 10px; background-color: orange } .hsl { color: #b3222280 }`, {
    beautify: true,
    convertColor: ColorType.SRGB,
});

console.debug(result.code);
```

The package has one entry point, for Node.js: `@tbela99/rust-css-parser-napi` (or
`@tbela99/rust-css-parser-napi/node`). It relies on node fs and fs/promises to read files, like
`@tbela99/css-parser/node`. The addon is loaded when the package is imported (top-level `await`).

## Differences with the TypeScript library

- Same API: the same exports, options and results, and the same output.
- Node.js only: there is no browser entry point (`/web`) and no UMD build.
- `result.write` is a view of memory owned by the addon: it cannot be transferred to a worker thread (`postMessage()`
  throws a `DataCloneError`). Transfer `result.write.slice()` instead, see
  [Zero copy between threads](./usage.md#zero-copy-between-threads).
- macOS and Linux only, and the addon is built on install (see above).
- The AST lives in Rust memory: the nodes are views of the arena columns, read when their properties are accessed (see
  [Arena Memory](./arena.md)).
- Do not mix the builds: an AST parsed by `@tbela99/rust-css-parser-napi` must be rendered and transformed by
  `@tbela99/rust-css-parser-napi`. Passed to `@tbela99/css-parser` or to `@tbela99/rust-css-parser-wasm`, it throws or
  renders an empty string.
- The package on JSR does not build the addon (JSR does not run install scripts): run `install.js` after installing
  it (see above). From Deno, use the [WebAssembly build](./wasm.md).

------
[← Getting started](./getting-started.md) | [WebAssembly →](./wasm.md)
