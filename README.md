[![npm](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftbela99%2Fcss-parser%2Fmaster%2Fpackage.json&query=version&logo=npm&label=npm&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40tbela99%2Fcss-parser)](https://www.npmjs.com/package/@tbela99/css-parser) [![cov](https://tbela99.github.io/css-parser/badges/coverage.svg)](https://github.com/tbela99/css-parser/actions) [![NPM Downloads](https://img.shields.io/npm/dm/%40tbela99%2Fcss-parser)](https://www.npmjs.com/package/@tbela99/css-parser)

# css-parser

CSS parser and minifier for node and the browser

## Installation

```shell
$ npm install @tbela99/css-parser
```

## Features

- fault-tolerant parser, will try to fix invalid tokens according to the CSS syntax module 3 recommendations.
- efficient minification, see [benchmark](https://tbela99.github.io/css-parser/benchmark/index.html)
- automatically generate nested css rules
- generate sourcemap
- compute css shorthands. see the list below
- compute calc() expression
- inline css variables
- relative css colors using rgb(), hsl() and hwb()
- nested css expansion
- remove duplicate properties
- flatten @import rules
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
- src: string, optional. original css file location to be used with sourcemap.
- sourcemap: boolean, optional. preserve node location data.
- nestingRules: boolean, optional. automatically generated nested rules.
- expandNestingRules: boolean, optional. convert nesting rules into separate rules. will automatically set nestingRules to false.
- removeCharset: boolean, optional. remove @charset.
- removeEmpty: boolean, optional. remove empty rule lists from the ast.
- resolveUrls: boolean, optional. resolve css 'url()' according to the parameters 'src' and 'cwd'
- resolveImport: boolean, optional. replace @import rule by the content of its referenced stylesheet.
- cwd: string, optional. the current working directory. when specified url() are resolved using this value
- removeDuplicateDeclarations: boolean, optional. remove duplicate declarations.
- computeShorthand: boolean, optional. compute shorthand properties.
- inlineCssVariables: boolean, optional. replace css variables with their current value.
- computeCalcExpression: boolean, optional. evaluate calc() expression
- inlineCssVariables: boolean, optional. replace some css variables with their actual value. they must be declared once in the :root {} rule.
- visitor: VisitorNodeMap, optional. node visitor used to transform the ast.
- signal: AbortSignal, optional. abort parsing.

#### RenderOptions

- minify: boolean, optional. default to _true_. minify css output.
- expandNestingRules: boolean, optional. expand nesting rules.
- sourcemap: boolean, optional. generate sourcemap
- preserveLicense: boolean, force preserving comments starting with '/\*!' when minify is enabled.
- sourcemap: boolean, optional. generate sourcemap.
- indent: string, optional. css indention string. uses space character by default.
- newLine: string, optional. new line character.
- removeComments: boolean, remove comments in generated css.
- colorConvert: boolean, convert colors to hex.
- output: string, optional. file where to store css. url() are resolved according to the specified value. no file is created though.
- cwd: string, optional. value used as current working directory. when output is not provided, urls are resolved according to this value.

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
render(ast, RenderOptions = {});
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

### Example 3

### Calc() resolution

```javascript

import {parse, render} from '@tbela99/css-parser';

const css = `

.foo-bar {
    width: calc(100px * 2);
    height: calc(((75.37% - 63.5px) - 900px) + (2 * 100px));
    max-width: calc(3.5rem + calc(var(--bs-border-width) * 2));
}
`;

const prettyPrint = await parse(css).then(result => render(result.ast, {minify: false}).code);

```
result

```css
.foo-bar {
    width: 200px;
    height: calc(75.37% - 763.5px);
    max-width: calc(3.5rem + var(--bs-border-width)*2)
}
```

### Example 4

### CSS variable inlining

```javascript

import {parse, render} from '@tbela99/css-parser';

const css = `

:root {

--preferred-width: 20px;
}
.foo-bar {

    width: calc(calc(var(--preferred-width) + 1px) / 3 + 5px);
    height: calc(100% / 4);}
`

const prettyPrint = await parse(css, {inlineCssVariables: true}).then(result => render(result.ast, {minify: false}).code);

```
result

```css
.foo-bar {
    width: 12px;
    height: 25%
}

```

### Example 5

### CSS variable inlining and relative color

```javascript

import {parse, render} from '@tbela99/css-parser';

const css = `

:root {
--color: green;
}
._19_u :focus {
    color:  hsl(from var(--color) calc(h * 2) s l);

}
`

const prettyPrint = await parse(css, {inlineCssVariables: true}).then(result => render(result.ast, {minify: false}).code);

```
result

```css
._19_u :focus {
    color: navy
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

## Sourcemap

- [x] sourcemap generation

## Minification

- [x] reduce calc()
- [x] inline css variables
- [x] merge identical rules
- [x] merge adjacent rules
- [x] minify colors
- [x] minify numbers and Dimensions tokens
- [x] compute shorthand: see the list below
- [x] remove redundant declarations
- [x] conditionally unwrap :is()
- [x] automatic css nesting
- [x] automatically wrap selectors using :is()
- [x] avoid reparsing (declarations, selectors, at-rule)
- [x] node and browser versions
- [x] decode and replace utf-8 escape sequence

## Computed shorthands properties

- ~all~
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

## Node Transformation

Ast can be transformed using node visitors

### Exemple 1: Declaration

```typescript

import {AstDeclaration, ParserOptions} from "../src/@types";

const options: ParserOptions = {

    visitor: {

        Declaration: (node: AstDeclaration) => {

            if (node.nam == '-webkit-transform') {

                node.nam = 'transform'
            }
        }
    }
}

const css = `

.foo {
    -webkit-transform: scale(calc(100 * 2/ 15));
}
`;

console.debug(await transform(css, options));

// .foo{transform:scale(calc(40/3))}
```

### Exemple 2: Declaration

```typescript

import {AstDeclaration, LengthToken, ParserOptions} from "../src/@types";
import {EnumToken, NodeType} from "../src/lib";
import {transform} from "../src/node";

const options: ParserOptions = {

    visitor: {

        Declaration: {

            // called only for height declaration
            height: (node: AstDeclaration): AstDeclaration[] => {


                return [
                    node,
                    {

                        typ: NodeType.DeclarationNodeType,
                        nam: 'width',
                        val: [
                            <LengthToken>{
                                typ: EnumToken.Length,
                                val: '3',
                                unit: 'px'
                            }
                        ]
                    }
                ];
            }
        }
    }
};

const css = `

.foo {
    height: calc(100px * 2/ 15);
}
`;

console.debug(await transform(css, options));

// .foo{height:calc(40px/3);width:3px}

```

### Exemple 3: At-Rule

```typescript

import {AstAtRule, ParserOptions} from "../src/@types";
import {transform} from "../src/node";


const options: ParserOptions = {

    visitor: {

        AtRule: (node: AstAtRule): AstAtRule => {
            
            if (node.nam == 'media') {

                return {...node, val: 'all'}
            }
        }
    }
};

const css = `

@media screen {
       
    .foo {

            height: calc(100px * 2/ 15);    
    } 
}
`;

console.debug(await transform(css, options));

// .foo{height:calc(40px/3)}

```

### Exemple 4: At-Rule

```typescript

import {AstAtRule, ParserOptions} from "../src/@types";
import {transform} from "../src/node";

const options: ParserOptions = {

    visitor: {

        AtRule: {

            media: (node: AstAtRule): AstAtRule => {

                return {...node, val: 'all'}
            }
        }
    }
};

const css = `

@media screen {
       
    .foo {

            height: calc(100px * 2/ 15);    
    } 
}
`;

console.debug(await transform(css, options));

// .foo{height:calc(40px/3)}

```

### Exemple 5: Rule

```typescript

import {AstAtRule, ParserOptions} from "../src/@types";
import {transform} from "../src/node";

const options: ParserOptions = {

    visitor: {


        Rule (node: AstRule): AstRule {

            return {...node, sel: '.foo,.bar,.fubar'};
        }
    }
};

const css = `

    .foo {

            height: calc(100px * 2/ 15);    
    } 
`;

console.debug(await transform(css, options));

// .foo,.bar,.fubar{height:calc(40px/3)}

```

---

Thanks to [Jetbrains](https://jetbrains.com) for sponsoring this project with a free license