---
title: Validation
group: Documents
category: Guides
---

## Validation

Validation is powered by [mdn-data](https://github.com/mdn/data) and can be enabled using the [`validation`](../docs/interfaces/node.ParserOptions.html#validation) parser option.

The `validation` option accepts a **boolean** value:

- `true` — Validates all CSS declaration nodes.
- `false` — Validates declaration nodes only when they are used as shorthand properties.

CSS rules and at-rules are always validated, regardless of the `validation` setting. The option only controls whether CSS declarations are checked against their syntax definitions for correctness. Validation does not affect the resulting CSS.

```ts


import {transform, TransformOptions, ValidationLevel} from "@tbela99/css-parser";

const options: TransformOptions = {

    validation: true,
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

// <empty>
```

## Lenient validation

The parser is lenient. This means that unknown at-rules and declarations are preserved by default.
This behavior is changed using the [lenient](../docs/interfaces/node.ParserOptions.html#lenient) option.

## Validation errors

Validation errors are returned with [parse result](../docs/interfaces/node.ParseResult.html) or [transform result](../docs/interfaces/node.TransformResult.html).
Check the [typescript definition](../docs/interfaces/node.ErrorDescription.html) of ErrorDescription for more details.


```ts

console.debug(result.errors);
```

## Ast nodes validation state

Validation results are available through the node's `state` property, while detailed validation errors can be accessed from the node's `errors` property.

The following example prints the validation state of each node, along with any validation error details.

```ts

import {EnumToken, EnumAstNodeStatus, transform} from "@tbela99/css-parser";
import type {TransformOptions, VisitorNodeMap, AstAtRule, AstRule, AstDeclaration} from "@tbela99/css-parser";
const options: TransformOptions = {

    beautify: true,
    validation: true,
    visitor: {
        AtRule: (node: AstAtRule) => {
            
            console.debug('>>> ' + node.nam, '\n state: ' +EnumAstNodeStatus[node.state], '\n errors:', node.errors)
        },
        Rule: (node: AstRule) => {
            
            console.debug('>>> ' + node.sel, '\n state: ' + EnumAstNodeStatus[node.state], '\n errors:', node.errors)
        },
        Declaration: (node: AstDeclaration) => {
            
            console.debug('>>> ' + node.nam, '\n state: ' + EnumAstNodeStatus[node.state], '\n errors:', node.errors)
        }
    } as VisitorNodeMap
};

const css = `

.xl\\:stats-horizontal:where([dir="rtl"], [dir="rtl"] *),
.prose :where(tbody tr, thead):not(:where([class~="not-prose"] *)),
.prose :where(code):not(:where([class~="not-prose"] *, pre *)) {
  noise: 0.5;
}
@supports not selector(:has(*)) {
  noise: 0.5;
}
.table-bordered > :not(caption) > * {
    border-width: var(--bs-border-width) 0
}

.table-bordered > :not(caption) > * > * {
    border-width: 0 var(--bs-border-width);
    line-height: auto;
}
`;

const result = await transform(css, options);

// > >>> .xl\:stats-horizontal:where([dir=rtl],[dir=rtl] *),.prose :where(tbody tr,thead):not(:where([class~=not-prose] *)),.prose :where(code):not(:where([class~=not-prose] *,pre *)) 
// >  state: Validated 
// >  errors: []
// > >>> noise 
// >  state: Unknown 
// >  errors: []
// > >>> supports 
// >  state: Validated 
// >  errors: []
// > >>> noise 
// >  state: Unknown 
// >  errors: []
// > >>> .table-bordered>:not(caption)>* 
// >  state: Validated 
// >  errors: []
// > >>> border-width 
// >  state: Validated 
// >  errors: []
// > >>> .table-bordered>:not(caption)>*>* 
// >  state: Validated 
// >  errors: []
// > >>> border-width 
// >  state: Validated 
// >  errors: []
// > >>> line-height 
// >  state: ValidationFailed 
// >  errors: [
// >   {
// >     action: "drop",
// >     message: "could not match syntax",
// >     node: { typ: 7, val: "auto" },
// >     location: {
// >       src: "",
// >       sta: { ind: 444, lin: 17, col: 18 },
// >       end: { ind: 449, lin: 17, col: 23 }
// >     },
// >     syntax: {
// >       typ: 28,
// >       chi: [ [ [Object] ], [ [Object] ], [ [Object] ], [ [Object] ] ]
// >     }
// >   }
// > ]

```

## Overriding Node Validation State

A node's validation state can be overridden using node visitors. The `state` property is an [`EnumAstNodeStatus`](../enums/node.EnumAstNodeStatus.html) value.

By default, nodes with any of the following states are discarded unless their state is overridden by a visitor:

- `EnumAstNodeStatus.Invalid`
- `EnumAstNodeStatus.Disallowed`
- `EnumAstNodeStatus.Unknown` (preserved when `lenient` is set to `true`)
- `EnumAstNodeStatus.Unparsed`
- `EnumAstNodeStatus.Malformed`

In the example below, the node's validation state is changed from `EnumAstNodeStatus.Invalid` to `EnumAstNodeStatus.ValidationFailed`, causing the node to be preserved in the output instead of being discarded.

```ts

import {EnumToken, EnumAstNodeStatus, transform} from "@tbela99/css-parser";
import type {TransformOptions, VisitorNodeMap, AstDeclaration} from "@tbela99/css-parser";
const options: TransformOptions = {

    beautify: true,
    validation: true,
    visitor: {
        AtRule: (node: AstAtRule) => {
            
            if (node.state == EnumAstNodeStatus.Invalid) {

                node.state = EnumAstNodeStatus.ValidationFailed;
            }
        },
    } as VisitorNodeMap
};

const css = `

@supports 1 {

    .foo {

            height: calc(100px * 2/ 15);
            height: 'new';
            height: auto;
    }
}
`;

const result = await transform(css, options);
console.debug(result.code);
```

------
[← Usage](./Guide.Usage.html) | [CSS Module →](./css-module.md)