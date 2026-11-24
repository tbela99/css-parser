---
title: Performance
group: Documents
category: Guides
---

## About

CSS-Parser is available in three builds with the same API and the same output:

- `@tbela99/css-parser`: the TypeScript library
- [`@tbela99/rust-css-parser-napi`](./native.md): the Rust port, a native addon for Node.js (macOS and Linux)
- [`@tbela99/rust-css-parser-wasm`](./wasm.md): the Rust port compiled to WebAssembly, for Node.js and the browsers

This page compares their speed, and compares them with [lightningcss](https://lightningcss.dev/) and
[esbuild](https://esbuild.github.io/). The results of all the minifiers are on the
[benchmark](https://tbela99.github.io/css-parser/benchmark/index.html) page.

The measures below are the median of several runs of `transformSync()`, on an Apple M2 with Node.js 27: the results
depend on the machine.

## The three builds

Time to minify with the default settings. The output of the three builds is identical byte for byte.

| File | Size | TypeScript | N-API | WebAssembly |
|------|-----:|-----------:|------:|------------:|
| tailwind.css | 2.3 MB | 188.4 ms | 89.6 ms (2.1x) | 106.6 ms (1.8x) |
| bootstrap-5.css | 201 KB | 24.8 ms | 17.9 ms (1.4x) | 15.1 ms (1.6x) |
| foundation.css | 164 KB | 21.5 ms | 11.7 ms (1.8x) | 15.6 ms (1.4x) |
| animate.css | 93 KB | 10.0 ms | 6.5 ms (1.5x) | 9.4 ms (1.1x) |
| font-awesome-all.css | 71 KB | 7.1 ms | 2.9 ms (2.4x) | 3.8 ms (1.9x) |
| normalize.css | 6 KB | 0.4 ms | 0.3 ms (1.7x) | 0.4 ms (1.1x) |

The N-API build is the fastest on most files, up to 2.4 times faster than the TypeScript library. The WebAssembly build
is up to 1.9 times faster than the TypeScript library.

## Minification vs execution speed

The default settings apply every minification. The settings below disable the [minification](./minification.md) of the
ast (`minify: false`: shorthand computation, rule merging and nesting, removal of duplicate and overridden
declarations, ...) and keep the cheap ones: the output is larger, the minification is faster. See
[Minification performance vs execution speed](./usage.md#minification-performance-vs-execution-speed).

```javascript
const fast = {
    minify: false,
    beautify: false,
    removeEmpty: true,
    removeComments: true,
    convertColor: true,
};

const result = transformSync({input: css, ...fast});
```

tailwind.css, TypeScript library:

| File:  tailwind.css   | Fast settings      | Default settings          |
| --------------------- | ------------------ | ------------------------- |
| Size: 2,380,419 bytes | 1,888,460 bytes    | 1,624,148 bytes           |
| Time                  | 109.07 ms          | 193.85 ms                 |
| Size reduction        | -20.7%             | -31.8%                    |

## Compared with lightningcss and esbuild

The 12 files of the [benchmark](https://tbela99.github.io/css-parser/benchmark/index.html) (3.1 MB), total of the
median times and of the output sizes:

| Library | Time | Output | Output vs lightningcss |
|---------|-----:|-------:|-----------------------:|
| lightningcss | 59.6 ms | 2370 KB | |
| esbuild | 113.1 ms | 2487 KB | +4.9% |
| N-API, default settings | 136.7 ms | 2098 KB | **-11.5%** |
| WebAssembly, default settings | 166.3 ms | 2098 KB | **-11.5%** |
| TypeScript, default settings | 292.8 ms | 2098 KB | **-11.5%** |
| N-API, fast settings | 65.9 ms | 2404 KB | +1.4% |
| WebAssembly, fast settings | 94.1 ms | 2404 KB | +1.4% |
| TypeScript, fast settings | 176.7 ms | 2404 KB | +1.4% |

- With the default settings, the output is 11.5% smaller than lightningcss. Lightningcss is about 2.3 times faster
  than the N-API build.
- With the fast settings, the N-API build is about as fast as lightningcss, with an output 1.4% larger.

------
[← WebAssembly build](./wasm.md) | [Usage →](./usage.md)
