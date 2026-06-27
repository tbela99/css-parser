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
  
## Benchmark

Across all tested datasets, css-parser consistently produces the smallest output among the benchmarked tools, including Lightning CSS, cssnano, csso, clean-css, css-tree, and esbuild. 

The [benchmark](https://tbela99.github.io/css-parser/benchmark/index.html) evaluates minification effectiveness on a diverse set of real-world stylesheets, including Bootstrap 4, Bootstrap 5, Tailwind CSS, Animate.css, Foundation, Font Awesome, Normalize.css, and others.

A sample result:

| File | ligthningcss | CSS Parser |
| --- | --- | --- |
| tailwind.css - 2380419 bytes | 1864728 bytes | 1501464 bytes |
| bootstrap-4.css - 200078 bytes | 153616 bytes | 144716 bytes |
| bootstrap-5.css - 205481 bytes | 159987 bytes | 150964 bytes |

On the complete benchmark suite, css-parser generated a total output size of 2,072,973 bytes, compared to 2,494,113 bytes for Lightning CSS and larger outputs for all other tested minifiers. 
While some tools prioritize raw execution speed, css-parser focuses on maximizing compression while preserving stylesheet semantics, resulting in consistently smaller production bundles.

## Playground

Try it [online](https://tbela99.github.io/css-parser/playground/)

## Documentation

- [Installation](https://tbela99.github.io/css-parser/docs/documents/Guide.Getting_Started.html)
- [Usage](https://tbela99.github.io/css-parser/docs/documents/Guide.Usage.html)
- [Parsing](https://tbela99.github.io/css-parser/docs/documents/Guide.Parsing.html)
  - [Parsing options](https://tbela99.github.io/css-parser/docs/documents/Guide.Parsing.html#parsing-options)
  - [Parsing files](https://tbela99.github.io/css-parser/docs/documents/Guide.Parsing.html#parsing-files)
  - [Parsing streams](https://tbela99.github.io/css-parser/docs/documents/Guide.Parsing.html#parsing-from-a-readable-stream)
- [Rendering](https://tbela99.github.io/css-parser/docs/documents/Guide.Rendering.html)
  - [Rendering options](https://tbela99.github.io/css-parser/docs/documents/Guide.Rendering.html#renderoptions)
  - [Pretty printing](https://tbela99.github.io/css-parser/docs/documents/Guide.Rendering.html#pretty-printing)
  - [Converting colors](https://tbela99.github.io/css-parser/docs/documents/Guide.Rendering.html#converting-colors)
- [Validation](https://tbela99.github.io/css-parser/docs/documents/Guide.Validation.html)
- [CSS Modules](https://tbela99.github.io/css-parser/docs/documents/Guide.CSS_Modules.html)
  - [Scopes](https://tbela99.github.io/css-parser/docs/documents/Guide.CSS_Modules.html#scope)
  - [Class composition](https://tbela99.github.io/css-parser/docs/documents/Guide.CSS_Modules.html#class-composition)
  - [Naming](https://tbela99.github.io/css-parser/docs/documents/Guide.CSS_Modules.html#naming)
  - [Pattern](https://tbela99.github.io/css-parser/docs/documents/Guide.CSS_Modules.html#pattern)
- Syntax lowering
  - [Expand CSS nesting rules](https://tbela99.github.io/css-parser/docs/documents/Guide.Parsing.html#expand-css-nesting-rules)
  - [Expand CSS if() syntax](https://tbela99.github.io/css-parser/docs/documents/Guide.Parsing.html#css-if-function-expansion)
- [Minification](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html)

  - [Keyframes](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#keyframes)
  - [Inline css variables](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#css-variables-inlining)
  - [Transform functions](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#transform-functions)
  - [Math functions](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#math-functions)
  - Gradient functions
  - [Colors](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#color-minification)
  - [Numbers and Dimensions](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#css-values)
  - [Multi-pass minification](https://tbela99.github.io/css-parser/docs/interfaces/node.MinifyOptions.html#pass)
  - [Merge adjacent rules](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#merging-adjacent-rules)
  - [Compute shorthand](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#shorthands): see the list [below](#computed-shorthands-properties)
  - [Remove redundant declarations](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#redundant-declarations)
  - [Conditionally wrap or unwrap selectors using :is()](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#conditional-wrapping-or-unwrapping-selectors-using-is)
  - [Automatic css nesting](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#css-nesting)
  - Avoid reparsing (declarations, selectors, at-rule)
  - [Decode and replace utf-8 escape sequence](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html#utf-8-escape-sequence)
  - [CSS prefix removal (Experimental)](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html##experimental-css-prefix-removal)
- [Custom Transform](https://tbela99.github.io/css-parser/docs/documents/Guide.Custom_Transform.html)
- [Ast](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast.html)
  - [Ast traversal](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast.Ast_Traversal.html)
    - [walk()](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast.Ast_Traversal.html)
    - [find()](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast.Ast_Traversal.html#find)
    - [findAll()](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast.Ast_Traversal.html#findall)
    - [findLast()](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast.Ast_Traversal.html#findlast)
    - [walkValues()](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast.Ast_Traversal.html#walkvalues)
    - [findByValue()](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast.Ast_Traversal.html#findbyvalue)
    - [findValue()](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast.Ast_Traversal.html#findvalue)
  - [Ast utilities](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast.Ast_Utilities.html)
 - Color manipulation
   - Supported colors
   - Color distance
   - Converting colors


## AST

### Comment

- typ: number
- val: string, the comment

### Declaration

- typ: number
- nam: string, declaration name
- val: array of tokens

### Rule

- typ: number
- sel: string, css selector
- chi: array of children

### AtRule

- typ: number
- nam: string. AtRule name
- val: rule prelude

### AtRuleStyleSheet

- typ: number
- chi: array of children

### KeyFrameRule

- typ: number
- sel: string, css selector
- chi: array of children

## Sourcemap

- [x] Sourcemap generation

## Minification

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

- [x] flatten @import
