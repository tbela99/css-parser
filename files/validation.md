---
title: Validation
group: Documents
category: Guides
---

## Validation

Validation is performed using [mdn-data](https://github.com/mdn/data). The validation level can be configured using the [validation](../docs/interfaces/node.ParserOptions.html#validation) option.
Possible values are _boolean_ or [ValidationLevel](../docs/enums/node.ValidationLevel.html):

- _true_ or [ValidationLevel.All](../docs/media/node.ValidationLevel.html#all): validates all nodes
- _false_ or [ValidationLevel.None](../docs/media/node.ValidationLevel.html#none): no validation
- [ValidationLevel.Selector](../docs/media/node.ValidationLevel.html#selector): validates only selectors
- [ValidationLevel.AtRule](../docs/media/node.ValidationLevel.html#atrule): validates only at-rules
- [ValidationLevel.Declaration](../docs/media/node.ValidationLevel.html#declaration): validates only declarations
- [ValidationLevel.Default](../docs/media/node.ValidationLevel.html#default): validates selectors and at-rules

```ts

import {transform, TransformOptions, ValidationLevel} from "@tbela99/css-parser";

const options: TransformOptions = {

    validation: ValidationLevel.All,
    beautify: true,
    removeDuplicateDeclarations: 'height'
};

const css = `

@supports(height: 30pti) {

    .foo {

            height: calc(100px * 2/ 15);
            height: 'new';
            height: auto;
    }
}
`;

const result = await transform(css, options);
console.debug(result.code);

// @supports (height:30pti) {
// .foo {
//         height: calc(40px/3);
//         height: auto
//     }
// }
```

## Lenient validation

The parser is lenient. This means that invalid nodes are kept in the ast but they are not rendered.
This behavior can be changed using the [lenient](../docs/interfaces/node.ParserOptions.html#lenient) option.

## Validation errors

Validation errors are returned with [parse result](../docs/interfaces/node.ParseResult.html) or [transform result](../docs/interfaces/node.TransformResult.html).
Check the [typescript definition](../docs/interfaces/node.ErrorDescription.html) of ErrorDescription for more details.


```ts

console.debug(result.errors);
```

## Invalid tokens handling

[Bad tokens](../docs/enums/node.EnumToken.html#badcdotokentype) are thrown out during parsing. visitor functions can be used to catch and fix invalid tokens.

```ts

import {EnumToken, transform, TransformOptions, ValidationLevel} from "@tbela99/css-parser";
const options: TransformOptions = {

    validation: ValidationLevel.All,
    beautify: true,
    removeDuplicateDeclarations: 'height',
    visitor: {
        InvalidRuleNodeType(node) {

            console.debug(`> found '${EnumToken[node.typ]}'`);
        },
        InvalidDeclarationNodeType(node) {
            console.debug(`> found '${EnumToken[node.typ]}' in '${node.loc.src}' at ${node.loc.sta.lin}:${node.loc.sta.col}`);
        },
        InvalidClassSelectorTokenType(node) {
            console.debug(`> found '${EnumToken[node.typ]}' in '${node.loc.src}' at ${node.loc.sta.lin}:${node.loc.sta.col}`);
        },
        InvalidAttrTokenType(node) {
            console.debug(`> found '${EnumToken[node.typ]}' in '${node.loc.src}' at ${node.loc.sta.lin}:${node.loc.sta.col}`);
        },
        InvalidAtRuleNodeType(node) {
            console.debug(`> found '${EnumToken[node.typ]}' in '${node.loc.src}' at ${node.loc.sta.lin}:${node.loc.sta.col}`);
        }
    }
};

const css = `

@supports(height: 30pti) {

    .foo {

            height: calc(100px * 2/ 15);
            height: 'new';
            height: auto;
    }
}

@supports(height: 30pti);
`;

const result = await transform(css, options);

// > found 'InvalidRuleNodeType' in '' at 3:1
// > found 'InvalidDeclarationNodeType' in '' at 8:13

```

## Example

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

------
[← Rendering](./rendering.md) | [CSS Module →](./css-module.md)