[![playground](https://img.shields.io/badge/playground-try%20it%20now-%230a7398
)](https://tbela99.github.io/css-parser/playground/) [![npm](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftbela99%2Fcss-parser%2Fmaster%2Fpackage.json&query=version&logo=npm&label=npm&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40tbela99%2Fcss-parser)](https://www.npmjs.com/package/@tbela99/css-parser) [![npm](https://img.shields.io/jsr/v/%40tbela99/css-parser?link=https%3A%2F%2Fjsr.io%2F%40tbela99%2Fcss-parser
)](https://jsr.io/@tbela99/css-parser) [![cov](https://tbela99.github.io/css-parser/badges/coverage.svg)](https://github.com/tbela99/css-parser/actions) [![Doc](https://img.shields.io/badge/online-documentation-blue)](https://tbela99.github.io/css-parser/docs) [![NPM Downloads](https://img.shields.io/npm/dm/%40tbela99%2Fcss-parser)](https://www.npmjs.com/package/@tbela99/css-parser) [![bundle size](https://img.shields.io/bundlejs/size/%40tbela99/css-parser%400.9.0?exports=cjs)](https://www.npmjs.com/package/@tbela99/css-parser)

# css-parser

CSS parser, minifier and validator for node and the browser

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

- no dependency
- CSS validation based upon mdn-data
- CSS modules support
- fault-tolerant parser implementing the CSS syntax module 3 recommendations.
- fast and efficient minification without unsafe transforms,
  see [benchmark](https://tbela99.github.io/css-parser/benchmark/index.html)
- colors minification: color(), lab(), lch(), oklab(), oklch(), color-mix(), light-dark(), system colors and
  relative color
- color conversion to any supported color format
- automatic nested css rules generation
- nested css rules conversion to legacy syntax
- convert css if() function to legacy syntax
- sourcemap generation
- css shorthands computation. see the supported properties list below
- css transform functions minification
- css math functions evaluation: calc(), clamp(), min(), max(), etc.
- css variables inlining
- duplicate properties removal
- @import rules flattening
- experimental CSS prefix removal

## Playground

Try it [online](https://tbela99.github.io/css-parser/playground/)

## Documentation

- [Installation](https://tbela99.github.io/css-parser/docs/documents/Guide.Getting_Started.html)
- [Usage](https://tbela99.github.io/css-parser/docs/documents/Guide.Usage.html)
- [Parsing](https://tbela99.github.io/css-parser/docs/documents/Guide.Parsing.html)
- [Rendering](https://tbela99.github.io/css-parser/docs/documents/Guide.Rendering.html)
- [Validation](https://tbela99.github.io/css-parser/docs/documents/Guide.Validation.html)
- [CSS Modules](https://tbela99.github.io/css-parser/docs/documents/Guide.CSS_Modules.html)
- [Minification](https://tbela99.github.io/css-parser/docs/documents/Guide.Minification.html)
- [Custom Transform](https://tbela99.github.io/css-parser/docs/documents/Guide.Custom_Transform.html)
- [Ast](https://tbela99.github.io/css-parser/docs/documents/Guide.Ast.html)

## Exported functions

```ts

/* parse and render css */
transform(css: string | ReadableStream<string>, options?: TransformOptions = {}): Promise<TransformResult>
/* parse css */
parse(css: string | ReadableStream<string>, options?: ParseOptions = {}): Promise<ParseResult>;
/* render ast */
render(ast: AstNode, options?: RenderOptions = {}): RenderResult;
/* parse and render css file or url */
transformFile(filePathOrUrl: string, options?: TransformOptions = {}, asStream?: boolean): Promise<TransformResult>;
/* parse css file or url */
parseFile(filePathOrUrl: string, options?: ParseOptions = {}, asStream?: boolean): Promise<ParseResult>;

```

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

- [x] sourcemap generation

## Minification

- [x] minify keyframes
- [x] minify transform functions
- [x] evaluate math functions calc(), clamp(), min(), max(), round(), mod(), rem(), sin(), cos(), tan(), asin(),
  acos(), atan(), atan2(), pow(), sqrt(), hypot(), log(), exp(), abs(), sign()
- [x] minify colors
- [x] minify numbers and Dimensions tokens
- [x] multi-pass minification
- [x] inline css variables
- [x] merge identical rules
- [x] merge adjacent rules
- [x] compute shorthand: see the list below
- [x] remove redundant declarations
- [x] conditionally unwrap :is()
- [x] automatic css nesting
- [x] automatically wrap selectors using :is()
- [x] avoid reparsing (declarations, selectors, at-rule)
- [x] node and browser versions
- [x] decode and replace utf-8 escape sequence
- [x] experimental CSS prefix removal

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
