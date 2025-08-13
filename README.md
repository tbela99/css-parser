[![playground](https://img.shields.io/badge/playground-try%20it%20now-%230a7398
)](https://tbela99.github.io/css-parser/playground/) [![npm](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftbela99%2Fcss-parser%2Fmaster%2Fpackage.json&query=version&logo=npm&label=npm&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40tbela99%2Fcss-parser)](https://www.npmjs.com/package/@tbela99/css-parser) [![npm](https://img.shields.io/jsr/v/%40tbela99/css-parser?link=https%3A%2F%2Fjsr.io%2F%40tbela99%2Fcss-parser
)](https://jsr.io/@tbela99/css-parser) [![cov](https://tbela99.github.io/css-parser/badges/coverage.svg)](https://github.com/tbela99/css-parser/actions) [![NPM Downloads](https://img.shields.io/npm/dm/%40tbela99%2Fcss-parser)](https://www.npmjs.com/package/@tbela99/css-parser) [![bundle size](https://img.shields.io/bundlejs/size/%40tbela99/css-parser%400.9.0?exports=cjs)](https://www.npmjs.com/package/@tbela99/css-parser)

# css-parser

CSS parser and minifier for node and the browser

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
- fault-tolerant parser, will try to fix invalid tokens according to the CSS syntax module 3 recommendations.
- fast and efficient minification without unsafe transforms,
  see [benchmark](https://tbela99.github.io/css-parser/benchmark/index.html)
- minify colors: color(), lab(), lch(), oklab(), oklch(), color-mix(), light-dark(), system colors and
  relative color
- generate nested css rules
- convert nested css rules to legacy syntax
- convert colors to any supported color format
- generate sourcemap
- compute css shorthands. see supported properties list below
- minify css transform functions
- evaluate math functions: calc(), clamp(), min(), max(), etc.
- inline css variables
- remove duplicate properties
- flatten @import rules
- experimental CSS prefix removal

## Playground

Try it [online](https://tbela99.github.io/css-parser/playground/)

## Exports

There are several ways to import the library into your application.

### Node exports

import as a module

```javascript

import {transform} from '@tbela99/css-parser';

// ...
```

### Deno exports

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

Javascript module from cdn

```html

<script type="module">

    import {transform} from 'https://esm.sh/@tbela99/css-parser@1.3.0/web';


    const css = `
    .s {

    background: color-mix(in hsl, color(display-p3 0 1 0) 80%, yellow);
}
    `;

    console.debug(await transform(css).then(r => r.code));

</script>
```

Javascript module

```javascript

<script src="dist/web/index.js" type="module"></script>
```

Single Javascript file

```javascript

<script src="dist/index-umd-web.js"></script>
```

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

> Minify Options

- minify: boolean, optional. default to _true_. optimize ast.
- pass: number, optional. minification pass. default to 1
- nestingRules: boolean, optional. automatically generated nested rules.
- expandNestingRules: boolean, optional. convert nesting rules into separate rules. will automatically set nestingRules
  to false.
- removeDuplicateDeclarations: boolean, optional. remove duplicate declarations.
- computeTransform: boolean, optional. compute css transform functions.
- computeShorthand: boolean, optional. compute shorthand properties.
- computeCalcExpression: boolean, optional. evaluate calc() expression
- inlineCssVariables: boolean, optional. replace some css variables with their actual value. they must be declared once
  in the :root {} or html {} rule.
- removeEmpty: boolean, optional. remove empty rule lists from the ast.

> CSS Prefix Removal Options

- removePrefix: boolean, optional. remove CSS prefixes.

> Validation Options

- validation: ValidationLevel | boolean, optional. enable validation. permitted values are:
    - ValidationLevel.None: no validation
    - ValidationLevel.Default: validate selectors and at-rules (default)
    - ValidationLevel.All. validate all nodes
    - true: same as ValidationLevel.All.
    - false: same as ValidationLevel.None
- lenient: boolean, optional. preserve invalid tokens.

> Sourcemap Options

- src: string, optional. original css file location to be used with sourcemap, also used to resolve url().
- sourcemap: boolean, optional. preserve node location data.

> Ast Traversal Options

- visitor: VisitorNodeMap, optional. node visitor used to transform the ast.

> Urls and \@import Options

- resolveImport: boolean, optional. replace @import rule by the content of the referenced stylesheet.
- resolveUrls: boolean, optional. resolve css 'url()' according to the parameters 'src' and 'cwd'

> Misc Options
- removeCharset: boolean, optional. remove @charset.
- cwd: string, optional. destination directory used to resolve url().
- signal: AbortSignal, optional. abort parsing.

#### RenderOptions

> Minify Options

- beautify: boolean, optional. default to _false_. beautify css output.
- minify: boolean, optional. default to _true_. minify css values.
- withParents: boolean, optional. render this node and its parents.
- removeEmpty: boolean, optional. remove empty rule lists from the ast.
- expandNestingRules: boolean, optional. expand nesting rules.
- preserveLicense: boolean, force preserving comments starting with '/\*!' when minify is enabled.
- removeComments: boolean, remove comments in generated css.
- convertColor: boolean | ColorType, convert colors to the specified color. default to ColorType.HEX. supported values are:
  - true: same as ColorType.HEX
  - false: no color conversion
  - ColorType.HEX
  - ColorType.RGB/ColorType.RGBA
  - ColorType.HSL
  - ColorType.HWB
  - ColorType.CMYK/ColorType.DEVICE_CMYK
  - ColorType.SRGB
  - ColorType.SRGB_LINEAR
  - ColorType.DISPLAY_P3
  - ColorType.PROPHOTO_RGB
  - ColorType.A98_RGB
  - ColorType.REC2020
  - ColorType.XYZ/ColorType.XYZ_D65
  - ColorType.XYZ_D50
  - ColorType.LAB
  - ColorType.LCH
  - ColorType.OKLAB
  - ColorType.OKLCH

> Sourcemap Options

- sourcemap: boolean | 'inline', optional. generate sourcemap. 

> Misc Options

- indent: string, optional. css indention string. uses space character by default.
- newLine: string, optional. new line character.
- output: string, optional. file where to store css. url() are resolved according to the specified value. no file is
  created though.
- cwd: string, optional. destination directory used to resolve url().

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

### Examples

Rendering ast

```javascript
import {parse, render} from '@tbela99/css-parser';

const css = `
@media screen and (min-width: 40em) {
    .featurette-heading {
        font-size: 50px;
    }
    .a {
        color: red;
        width: 3px;
    }
}
`;

const result = await parse(css, options);

// print declaration without parents
console.error(render(result.ast.chi[0].chi[1].chi[1], {withParents: false}));
// -> width:3px

// print declaration with parents
console.debug(render(result.ast.chi[0].chi[1].chi[1], {withParents: true}));
// -> @media screen and (min-width:40em){.a{width:3px}}

```

### Convert colors

```javascript
import {transform, ColorType} from '@tbela99/css-parser';


const css = `
.hsl { color: #b3222280; }
`;
const result: TransformResult = await transform(css, {
    beautify: true,
    convertColor: ColorType.SRGB
});

console.log(result.css);

```

result

```css
.hsl {
    color: color(srgb .7019607843137254 .13333333333333333 .13333333333333333/50%)
}
```

### Merge similar rules

CSS

```css

.clear {
    width: 0;
    height: 0;
    color: transparent;
}

.clearfix:before {

    height: 0;
    width: 0;
}
```

```javascript

import {transform} from '@tbela99/css-parser';

const result = await transform(css);

```

Result

```css
.clear, .clearfix:before {
    height: 0;
    width: 0
}

.clear {
    color: #0000
}
```

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

const result = await parse(css, {nestingRules: true}).then(result => render(result.ast, {minify: false}).code);
```

Result

```css
table.colortable {
    & td {
        text-align: center;

        &.c {
            text-transform: uppercase
        }

        &:first-child, &:first-child + td {
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

### CSS Validation

CSS

```css

#404 {
    --animate-duration: 1s;
}

.s, #404 {
    --animate-duration: 1s;
}

.s [type="text" {
    --animate-duration: 1s;
}

.s [type="text"]]
{
    --animate-duration: 1s;
}

.s [type="text"] {
    --animate-duration: 1s;
}

.s [type="text" i] {
    --animate-duration: 1s;
}

.s [type="text" s]
{
    --animate-duration: 1s
;
}

.s [type="text" b]
{
    --animate-duration: 1s;
}

.s [type="text" b],{
    --animate-duration: 1s
;
}

.s [type="text" b]
+ {
    --animate-duration: 1s;
}

.s [type="text" b]
+ b {
    --animate-duration: 1s;
}

.s [type="text" i] + b {
    --animate-duration: 1s;
}


.s [type="text"())]{
    --animate-duration: 1s;
}
.s(){
    --animate-duration: 1s;
}
.s:focus {
    --animate-duration: 1s;
}
```

with validation enabled

```javascript
import {parse, render} from '@tbela99/css-parser';

const options = {minify: true, validate: true};
const {code} = await parse(css, options).then(result => render(result.ast, {minify: false}));
//
console.debug(code);
```

```css
.s:is([type=text],[type=text i],[type=text s],[type=text i]+b,:focus) {
    --animate-duration: 1s
}
```

with validation disabled

```javascript   
import {parse, render} from '@tbela99/css-parser';

const options = {minify: true, validate: false};
const {code} = await parse(css, options).then(result => render(result.ast, {minify: false}));
//
console.debug(code);
```

```css
.s:is([type=text],[type=text i],[type=text s],[type=text b],[type=text b]+b,[type=text i]+b,:focus) {
    --animate-duration: 1s
}
```

### Nested CSS Expansion

CSS

```css
table.colortable {
    & td {
        text-align: center;

        &.c {
            text-transform: uppercase
        }

        &:first-child, &:first-child + td {
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
    text-align: center;
}

table.colortable td.c {
    text-transform: uppercase;
}

table.colortable td:first-child, table.colortable td:first-child + td {
    border: 1px solid black;
}

table.colortable th {
    text-align: center;
    background: black;
    color: white;
}
```

### Calc() resolution

```javascript

import {parse, render} from '@tbela99/css-parser';

const css = `
a {

width: calc(100px * log(625, 5));
}
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
a {
    width: 400px;
}

.foo-bar {
    width: 200px;
    height: calc(75.37% - 763.5px);
    max-width: calc(3.5rem + var(--bs-border-width) * 2)
}
```

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

### CSS variable inlining and relative color

```javascript

import {parse, render} from '@tbela99/css-parser';

const css = `

html { --bluegreen:  oklab(54.3% -22.5% -5%); }
.overlay {
  background:  oklab(from var(--bluegreen) calc(1.0 - l) calc(a * 0.8) b);
}
`

const prettyPrint = await parse(css, {inlineCssVariables: true}).then(result => render(result.ast, {minify: false}).code);

```

result

```css
.overlay {
    background: #0c6464
}

```

# Node Walker

```javascript
import {walk} from '@tbela99/css-parser';

for (const {node, parent, root} of walk(ast)) {

    // do something
}
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

## Node Transformation

Ast can be transformed using node visitors

### Exemple 1: Declaration

the visitor is called for any declaration encountered

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

the visitor is called only on 'height' declarations

```typescript

import {AstDeclaration, LengthToken, ParserOptions} from "../src/@types";
import {EnumToken} from "../src/lib";
import {transform} from "../src/node";

const options: ParserOptions = {

    visitor: {

        Declaration: {

            // called only for height declaration
            height: (node: AstDeclaration): AstDeclaration[] => {


                return [
                    node,
                    {

                        typ: EnumToken.DeclarationNodeType,
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
.selector {
color: lch(from peru calc(l * 0.8) calc(c * 0.7) calc(h + 180)) 
}
`;

console.debug(await transform(css, options));

// .foo{height:calc(40px/3);width:3px}.selector{color:#0880b0}

```

### Exemple 3: At-Rule

the visitor is called on any at-rule

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

the visitor is called only for at-rule media

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

the visitor is called on any Rule

```typescript

import {AstAtRule, ParserOptions} from "../src/@types";
import {transform} from "../src/node";

const options: ParserOptions = {

    visitor: {


        Rule(node: AstRule): AstRule {

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

### Exemple 6: Rule

Adding declarations to any rule

```typescript

import {transform} from "../src/node";
import {AstRule, ParserOptions} from "../src/@types";
import {parseDeclarations} from "../src/lib";

const options: ParserOptions = {

    removeEmpty: false,
    visitor: {

        Rule: async (node: AstRule): Promise<AstRule | null> => {

            if (node.sel == '.foo') {

                node.chi.push(...await parseDeclarations('width: 3px'));
                return node;
            }

            return null;
        }
    }
};

const css = `

.foo {
}
`;

console.debug(await transform(css, options));

// .foo{width:3px}

```
