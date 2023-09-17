[![npm](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftbela99%2Fcss-parser%2Fmaster%2Fpackage.json&query=version&logo=npm&label=npm&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40tbela99%2Fcss-parser)](https://www.npmjs.com/package/@tbela99/css-parser) [![cov](https://tbela99.github.io/css-parser/badges/coverage.svg)](https://github.com/tbela99/css-parser/actions)

# css-parser

CSS parser for node and the browser

## Installation

```shell
$ npm install @tbela99/css-parser
```

## Features

- fault tolerant parser, will try to fix invalid tokens according to the CSS syntax module 3 recommendations.
- efficient minification, see [benchmark](https://tbela99.github.io/css-parser/benchmark/index.html)
- automatically generate nested css rules
- compute css shorthands. see the list below
- expand nested css
- works the same way in node and web browser

## Transform

Parse and render css in a single pass.

### Usage

```typescript

transform(css, transformOptions: TransformOptions = {}): TransformResult
```

### Example

```javascript

import {transform} from '@tbela99/css-parser';

const {ast, code, map, errors, stats} = await transform(css, {minify: true, resolveImport: true, cwd: 'files/css'});
```

### TransformOptions

Include ParseOptions and RenderOptions

#### ParseOptions

- minify: boolean, optional. default to _true_. optimize ast.
- removeDuplicateDeclarations: boolean, optional. remove duplicate declarations.
- computeShorthand: boolean, optional. compute shorthand properties.
- src: string, optional. css file location to be used with sourcemap.
- sourcemap: boolean, optional. generate sourcemap
- expandNestingRules: boolean, optional. convert nesting rules into separate rules. will automatically set nestingRules to false.
- nestingRules: boolean, optional. automatically generated nested rules.
- removeCharset: boolean, optional. remove @charset.
- removeEmpty: boolean, optional. remove empty nodes from the ast.
- resolveUrls: boolean, optional. resolve css 'url()' according to the parameters 'src' and 'cwd'
- resolveImport: boolean, optional. replace @import node by the content of the referenced stylesheet.
- cwd: string, optional. the current working directory. when specified url() are resolved using this value
- inlineCssVariables: boolean, optional. replace some css variables with their actual value. they must be declared once in the :root {} rule.

#### RenderOptions
- minify: boolean, optional. default to _true_. minify css output.
- expandNestingRules: boolean, optional. expand nesting rules.
- preserveLicense: boolean, force preserving comments starting with '/\*!' when minify is enabled.
- sourcemap: boolean, optional. generate sourcemap.
- indent: string, optional. css indention string. uses space character by default.
- newLine: string, optional. new line character.
- removeComments: boolean, remove comments in generated css.
- colorConvert: boolean, convert colors to hex.


## Parsing

### Usage

```javascript

parse(css, parseOptions = {})
```

### Example

````javascript

const {ast, errors, stats} = await parse(css);
````

## Rendering

### Usage

```javascript
doRender(ast, RenderOptions = {});
```

### Example

```javascript
import {render} from '@tbela99/css-parser';

// minified
const {code, stats} = render(ast, {minify: true});

console.log(code);
```

## Node Walker

```javascript
import {walk} from '@tbela99/css-parser';

for (const {node, parent, root} of walk(ast)) {
    
    // do somehting
}
```

## Exports

There are several ways to import the library into your application.

### Node exports

import as a module

```javascript

import {transform} from '@tbela99/css-parser';

// ...
```
import as a CommonJS module

```javascript

const {transform} = require('@tbela99/css-parser/cjs');

// ...
```

### Web export

Programmatic import

```javascript

import {transform} from '@tbela99/css-parser/web';

// ...
```

Javascript module

```javascript

<script src="dist/web/index.js" type="module"></script>
```

Single JavaScript file

```javascript

<script src="dist/index-umd-web.js"></script>
```

## Example 1

### Automatic CSS Nesting

CSS

```javascript
const {parse, render} = require("@tbela99/css-parser/cjs");

const css = `
table.colortable td {
 text-align:center;
}
table.colortable td.c {
 text-transform:uppercase;
}
table.colortable td:first-child, table.colortable td:first-child+td {
 border:1px solid black;
}
table.colortable th {
 text-align:center;
 background:black;
 color:white;
}
`;

const result = await parse(css, {nestingRules:true}).then(result => render(result.ast, {minify:false}).code);
```

Result
```css
table.colortable {
 & td {
  text-align: center;
  &.c {
   text-transform: uppercase
  }
  &:first-child,&:first-child+td {
   border: 1px solid #000
  }
 }
 & th {
  text-align: center;
  background: #000;
  color: #fff
 }
}
```

## Example 2

### Nested CSS Expansion

CSS

```css
table.colortable {
 & td {
  text-align: center;
  &.c {
   text-transform: uppercase
  }
  &:first-child,&:first-child+td {
   border: 1px solid #000
  }
 }
 & th {
  text-align: center;
  background: #000;
  color: #fff
 }
}
```

Javascript
```javascript
import {parse, render} from '@tbela99/css-parser';


const options = {minify: true};

const {code} = await parse(css, options).then(result => render(result.ast, {minify: false, expandNestingRules: true}));
//
console.debug(code);
```

Result

```css

table.colortable td {
  text-align:center;
}
table.colortable td.c {
  text-transform:uppercase;
}
table.colortable td:first-child, table.colortable td:first-child+td {
  border:1px solid black;
}
table.colortable th {
  text-align:center;
  background:black;
  color:white;
}
```

## AST

### Comment

- typ: string 'Comment'
- val: string, the comment

### Declaration

- typ: string 'Declaration'
- nam: string, declaration name
- val: array of tokens

### Rule

- typ: string 'Rule'
- sel: string, css selector
- chi: array of children

### AtRule

- typ: string 'AtRule'
- nam: string. AtRule name
- val: rule prelude

### AtRuleStyleSheet

- typ: string 'Stylesheet'
- chi: array of children

## Minification

- [x] merge identical rules
- [x] merge adjacent rules
- [x] minify colors
- [x] minify numbers and Dimensions tokens
- [x] compute shorthand: see the list below
- [x] remove redundant declarations
- [x] conditionally unwrap :is()
- [x] automatic css nesting
- [x] automatically wrap selectors using :is()
- [x] multi-level shorthand properties (border - [border-width, border-color, border-style, etc.]) https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties
- [x] avoid reparsing (declarations, selectors, at-rule)
- [x] node and browser versions
- [x] decode and replace utf-8 escape sequence

## Computed shorthands
- [x] background
- [x] border
- [x] border-bottom
- [x] border-color
- [x] border-left
- [x] border-radius
- [x] border-right
- [x] border-style
- [x] border-top
- [x] border-width
- [x] font
- [x] inset
- [x] margin
- [x] outline
- [x] overflow
- [x] padding
- [x] text-decoration

## Performance

- [x] flatten @import
