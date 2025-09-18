---
title: Validation
group: Documents
slug: /validation
category: Guides
---

## Validation

validation is performed using [mdn-data](https://github.com/mdn/data). the validation level can be configured using the [validation](../docs/interfaces/node.ParserOptions.html#validation) option.
possible values are _boolean_ or [ValidationLevel](../docs/enums/node.ValidationLevel.html):

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

the parser is lenient. this means that invalid nodes are kept in the ast but they are not rendered.
this behavior can be changed using the [lenient](../docs/interfaces/node.ParserOptions.html#lenient) option.

## Validation Errors

validation errors are returned with [parse result](../docs/interfaces/node.ParseResult.html) or [transform result](../docs/interfaces/node.TransformResult.html).
check the [typescript definition](../docs/interfaces/node.ErrorDescription.html) of ErrorDescription for more details.


```ts

console.debug(result.errors);
```

## Invalid tokens handling

[bad tokens](../docs/enums/node.EnumToken.html#badcdotokentype) are thrown out during parsing. visitor functions can be used to catch and fix invalid tokens.

```ts

import {EnumToken, transform, TransformOptions, ValidationLevel} from "@tbela99/css-parser";
const options: TransformOptions = {

    validation: ValidationLevel.All,
    beautify: true,
    removeDuplicateDeclarations: 'height',
    visitor: {
        InvalidRuleTokenType(node) {

            console.debug(`> found '${EnumToken[node.typ]}'`);
        },
        InvalidAtRuleTokenType(node) {
            console.debug(`> found '${EnumToken[node.typ]}' in '${node.loc.src}' at ${node.loc.sta.lin}:${node.loc.sta.col}`);
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

//> found 'InvalidDeclarationNodeType' in '' at 8:13
//> found 'InvalidAtRuleTokenType' in '' at 13:1

```