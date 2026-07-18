[![playground](https://img.shields.io/badge/playground-try%20it%20now-%230a7398
)](https://tbela99.github.io/css-parser/playground/) [![npm](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftbela99%2Fcss-parser%2Fmaster%2Fpackage.json&query=version&logo=npm&label=npm&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40tbela99%2Fcss-parser)](https://www.npmjs.com/package/@tbela99/css-parser) [![npm](https://img.shields.io/jsr/v/%40tbela99/css-parser?link=https%3A%2F%2Fjsr.io%2F%40tbela99%2Fcss-parser
)](https://jsr.io/@tbela99/css-parser) [![cov](https://tbela99.github.io/css-parser/badges/coverage.svg)](https://github.com/tbela99/css-parser/actions) [![Doc](https://tbela99.github.io/css-parser/docs/coverage.svg)](https://tbela99.github.io/css-parser/docs) [![NPM Downloads](https://img.shields.io/npm/dm/%40tbela99%2Fcss-parser)](https://www.npmjs.com/package/@tbela99/css-parser) [![bundle size](https://img.shields.io/bundlejs/size/%40tbela99/css-parser%400.9.0?exports=cjs)](https://www.npmjs.com/package/@tbela99/css-parser)

# css-parser

CSS parser, transformer, minifier and validator for node and the browser

## Installation

From npm

```shell
$ npm install @tbela99/css-parser
```

from jsr

```shell
$ deno add @tbela99/css-parser
```

## Features

* **Zero dependencies** — lightweight and easy to integrate into any project.
* **Standards-based CSS validation** powered by MDN data.
* **Full CSS Modules support** for modern component-based workflows.
* **Fault-tolerant parsing** that follows the CSS Syntax Module Level 3 specification.
* **High-performance minification** with safe optimizations and no unsafe transforms.
* **Advanced color processing** with support for modern color spaces and functions, including `color()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color-mix()`, `light-dark()`, system colors, and relative colors.
* **Color conversion engine** capable of transforming colors between all supported formats.
* **Automatic CSS nesting generation** from compatible selectors.
* **Source map generation** for easier debugging and development workflows.
* **Shorthand property computation** to reduce output size and improve optimization.
* **Transform function optimization** for more compact CSS output.
* **Math function evaluation**, including `calc()`, `clamp()`, `min()`, `max()`, and related expressions.
* **CSS variable inlining** where values can be safely resolved.
* **Duplicate declaration removal** to eliminate redundant rules.
* **`@import` flattening** to produce self-contained stylesheets.

## Vendor prefix removal
**Experimental vendor prefix cleanup** to modernize generated CSS.

## Syntax lowering
CSS-Parser can transform these modern CSS features into lower-level CSS syntax:
* **Nested CSS transpilation** to legacy-compatible syntax.
* **`if()` function transpilation** for broader browser compatibility.
* **`color-mix()` function conversion** convert new color-mix() syntax to any of the supported colors.
  
## Benchmark

Across all tested datasets, css-parser consistently produces the smallest output among the benchmarked tools, including Lightning CSS, cssnano, csso, clean-css, css-tree, and esbuild. 

The [benchmark](https://tbela99.github.io/css-parser/benchmark/index.html) evaluates minification effectiveness on a diverse set of real-world stylesheets, including Bootstrap 4, Bootstrap 5, Tailwind CSS, Animate.css, Foundation, Font Awesome, Normalize.css, and others.

A sample result:

| File                           | ligthningcss  | CSS Parser    |
| ------------------------------ | ------------- | ------------- |
| tailwind.css - 2380419 bytes   | 1864728 bytes | 1633251 bytes |
| bootstrap-4.css - 200078 bytes | 153616 bytes  | 144700 bytes  |
| bootstrap-5.css - 205481 bytes | 159987 bytes  | 151258 bytes  |

On the [complete benchmark suite](https://tbela99.github.io/css-parser/benchmark/index.html), css-parser generated a total output size of 2,204,888 bytes, compared to 2,494,113 bytes for Lightning CSS and larger outputs for all other tested minifiers. 
While some tools prioritize raw execution speed, css-parser focuses on maximizing compression while preserving stylesheet semantics, resulting in consistently smaller production bundles.

## Playground

Try it [online](https://tbela99.github.io/css-parser/playground/)

## Documentation

- [Installation](https://tbela99.github.io/css-parser/docs/documents/Guide.Getting_started.html#installation)
- [Usage](https://tbela99.github.io/css-parser/docs/documents/Guide.Usage.html)
  - [Parsing CSS](https://tbela99.github.io/css-parser/docs/documents/Guide.Usage.html#parsing)
  - [Parsing files](https://tbela99.github.io/css-parser/docs/documents/Guide.Usage.html#parsing-files)
  - [Parsing streams](https://tbela99.github.io/css-parser/docs/documents/Guide.Usage.html#parsing-from-a-readable-stream)
  - [Rendering AST](https://tbela99.github.io/css-parser/docs/documents/Guide.Usage.html#rendering-ast)
  - [Transform](https://tbela99.github.io/css-parser/docs/documents/Guide.Usage.html#transform)
- [Validation](https://tbela99.github.io/css-parser/docs/documents/Guide.Validation.html)
- [CSS Modules](https://tbela99.github.io/css-parser/docs/documents/Guide.CSS_Modules.html)
- [Minification](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html)
- [Custom Transform](https://tbela99.github.io/css-parser/docs/documents/Guide.Custom_Transform.html)
- [Syntax Lowering](https://tbela99.github.io/css-parser/docs/documents/Guide.Syntax_Lowering.html)
- [Ast Manipulation](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast_Manipulation.html)
- [Utility Functions](https://tbela99.github.io/css-parser/docs/documents/Guide.Utility_Functions.html)
- 
## AST

### Comment

- typ: number
- val: string, the comment

### Declaration

- typ: number
- nam: string, declaration name
- val: array of tokens
- state: EnumAstNodeStatus, validation state
- errors: ErrorDescription[], validation errors

### Rule

- typ: number
- sel: string, css selector
- chi: array of children
- state: EnumAstNodeStatus, validation state
- errors: ErrorDescription[], validation errors

### AtRule

- typ: number
- nam: string. AtRule name
- val: rule prelude
- state: EnumAstNodeStatus, validation state
- errors: ErrorDescription[], validation errors

### AtRuleStyleSheet

- typ: number
- chi: array of children

### KeyFrameRule

- typ: number
- sel: string, css selector
- chi: array of children
- state: EnumAstNodeStatus, validation state
- errors: ErrorDescription[], validation errors

## Sourcemap

- [x] Sourcemap generation

## Computed shorthands properties

- [ ] ~all~
- [x] animation
- [x] background
- [x] border
- [ ] border-block-end
- [ ] border-block-start
- [x] border-bottom
- [x] border-color
- [ ] border-image
- [ ] border-inline-end
- [ ] border-inline-start
- [x] border-left
- [x] border-radius
- [x] border-right
- [x] border-style
- [x] border-top
- [x] border-width
- [x] column-rule
- [x] columns
- [x] container
- [ ] contain-intrinsic-size
- [x] flex
- [x] flex-flow
- [x] font
- [ ] font-synthesis
- [ ] font-variant
- [x] gap
- [ ] grid
- [ ] grid-area
- [ ] grid-column
- [ ] grid-row
- [ ] grid-template
- [x] inset
- [x] list-style
- [x] margin
- [ ] mask
- [ ] offset
- [x] outline
- [x] overflow
- [x] padding
- [ ] place-content
- [ ] place-items
- [ ] place-self
- [ ] scroll-margin
- [ ] scroll-padding
- [ ] scroll-timeline
- [x] text-decoration
- [x] text-emphasis
- [x] transition

## Performance

- [x] Bundle file referenced by the @import statement.
