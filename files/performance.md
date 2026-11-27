---
title: Performance
group: Documents
category: Guides
---

## Performance

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

| File | Size | N-API | WebAssembly | TypeScript |
|------|-----:|------:|------------:|-----------:|
| tailwind.css | 2.3 MB | 81.2 ms (2.1x) | 92.7 ms (1.8x) | 170.5 ms |
| bootstrap-5.css | 201 KB | 11.6 ms (1.7x) | 13.5 ms (1.5x) | 19.7 ms |
| foundation.css | 164 KB | 11.4 ms (1.7x) | 13.3 ms (1.4x) | 19.0 ms |
| animate.css | 93 KB | 5.5 ms (1.5x) | 6.3 ms (1.3x) | 8.1 ms |
| font-awesome-all.css | 71 KB | 2.6 ms (2.1x) | 3.0 ms (1.9x) | 5.6 ms |
| normalize.css | 6 KB | 0.3 ms (1.5x) | 0.3 ms (1.4x) | 0.5 ms |

The N-API build is the fastest on every file, up to 2.1 times faster than the TypeScript library. The WebAssembly build
is up to 1.9 times faster than the TypeScript library.

## Minification vs execution speed

The default settings apply the safe [minifications](./minification.md); the others are opt-in
(`inlineCssVariables`, `removePrefix`, `evaluateMixins`, ...). The fast mode does not minify the ast and does not merge
the rules: the values are minified when they are rendered. The output is larger, the
minification is faster. See
[Minification performance vs execution speed](./usage.md#minification-performance-vs-execution-speed).

```javascript
const result = transformSync(css, {fastMode: true});
```

`fastMode: true` sets these options, an option given explicitly takes precedence (`{fastMode: true, minify: true}`
minifies the ast):

```javascript
{
    // the ast is not minified
    minify: false,
    // the rules are not merged
    mergeRules: MergeRulesEnum.None,
}
```

tailwind.css, TypeScript library:

| File:  tailwind.css   | fastMode           | Default settings          |
| --------------------- | ------------------ | ------------------------- |
| Size: 2,380,419 bytes | 1,888,460 bytes    | 1,624,148 bytes           |
| Time                  | 98.59 ms           | 170.53 ms                 |
| Size reduction        | -20.7%             | -31.8%                    |

## Compared with lightningcss and esbuild

The 12 files of the [benchmark](https://tbela99.github.io/css-parser/benchmark/index.html) (3.0 MB), total of the
median times and of the output sizes:

| Library | Time | Output | Output vs lightningcss |
|---------|-----:|-------:|-----------------------:|
| N-API, fastMode | 55.8 ms | 2413 KB | +1.8% |
| lightningcss | 59.2 ms | 2370 KB |  |
| WebAssembly, fastMode | 68.4 ms | 2413 KB | +1.8% |
| esbuild | 119.8 ms | 2487 KB | +4.9% |
| N-API, default settings | 124.4 ms | 2107 KB | **-11.1%** |
| TypeScript, fastMode | 136.1 ms | 2413 KB | +1.8% |
| WebAssembly, default settings | 142.0 ms | 2107 KB | **-11.1%** |
| TypeScript, default settings | 243.9 ms | 2107 KB | **-11.1%** |

- With the default settings, the output is 11.1% smaller than lightningcss. Lightningcss is about 2.1 times faster
  than the N-API build.
- With `fastMode`, the N-API build is faster than lightningcss (6% faster), and its output is 1.8% larger. It is
  smaller than the output of esbuild.

------
[← Rust crate](./rust.md) | [Usage →](./usage.md)
