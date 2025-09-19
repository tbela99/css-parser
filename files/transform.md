---
title: Custom transform
group: Documents
category: Guides
---

## Custom transform

visitors are used to alter the ast tree produced by the parser. for more information about the visitor object see the [typescript definition](../docs/interfaces/node.VisitorNodeMap.html)

## Visitors order

visitors can be called when the node is entered, visited or left.

```ts

import {AstAtRule, ParserOptions, transform, VisitorNodeMap, WalkerEvent} from "@tbela99/css-parser";
const options: ParserOptions = {

    visitor: [
        {

            AtRule: [
                (node: AstAtRule): AstAtRule => {

                    console.error(`> visiting '@${node.nam}' node at position ${node.loc!.sta.lin}:${node.loc!.sta.col}`);
                    return node
                }, {

                    media: (node: AstAtRule): AstAtRule => {

                        console.error(`> visiting only '@${node.nam}' node at position ${node.loc!.sta.lin}:${node.loc!.sta.col}`);
                        return node
                    }
                }, {

                    type: WalkerEvent.Leave,
                    handler: (node: AstAtRule): AstAtRule => {

                        console.error(`> leaving '@${node.nam}' node at position ${node.loc!.sta.lin}:${node.loc!.sta.col}`)
                        return node
                    }
                },
                {
                    type: WalkerEvent.Enter,
                    handler: (node: AstAtRule): AstAtRule => {

                        console.error(`> enter '@${node.nam}' node at position ${node.loc!.sta.lin}:${node.loc!.sta.col}`);
                        return node
                    }
                }]
        }] as VisitorNodeMap[]
};

const css = `

@media screen {

    .foo {

            height: calc(100px * 2/ 15);
    }
}

@supports (height: 30pt) {

    .foo {

            height: calc(100px * 2/ 15);
    }
}
`;

const result = await transform(css, options);

console.debug(result.code);

// > enter '@media' node at position 3:1
// > visiting '@media' node at position 3:1
// > visiting only '@media' node at position 3:1
// > leaving '@media' node at position 3:1
// > enter '@supports' node at position 11:1
// > visiting '@supports' node at position 11:1
// > leaving '@supports' node at position 11:1

```

## At rule visitor

Example: change media at-rule prelude

```ts

import {transform, AstAtRule, ParserOptions} from "@tbela99/css-parser";
const options: ParserOptions = {

    visitor: {

        AtRule: {

            media: (node: AstAtRule): AstAtRule => {

                node.val = 'tv,screen';
                return node
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

const result = await transform(css, options);

console.debug(result.code);

// @media tv,screen{.foo{height:calc(40px/3)}}
```

### Declaration visitor

Example: add 'width: 3px' everytime a declaration with the name 'height' is found

```ts

import {transform, parseDeclarations} from "@tbela99/css-parser";
const options: ParserOptions = {

    removeEmpty: false,
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
                                typ: EnumToken.LengthTokenType,
                                val: 3,
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

Example: rename 'margin' to 'padding' and 'height' to 'width'

```ts

import {AstDeclaration, ParserOptions, transform} from "../src/node.ts";
const options: ParserOptions = {

    visitor: {

        // called for every declaration
        Declaration: (node: AstDeclaration): null => {


            if (node.nam == 'height') {

                node.nam = 'width';
            }

            else if (node.nam == 'margin') {

                node.nam = 'padding'
            }

            return null;
        }
    }
};

const css = `

.foo {
    height: calc(100px * 2/ 15);
    margin: 10px;
}
.selector {

margin: 20px;}
`;

const result = await transform(css, options);

console.debug(result.code);

// .foo{width:calc(40px/3);padding:10px}.selector{padding:20px}
```

### Rule visitor

Example: add 'width: 3px' to every rule with the selector '.foo'

```ts

import {transform, parseDeclarations} from "@tbela99/css-parser";
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
    .foo {
    }
}
`;

console.debug(await transform(css, options));

// .foo{width:3px;.foo{width:3px}}
```

### KeyframesRule visitor

keyframes rule visitor is called on each keyframes rule node.

### KeyframesAtRule visitor

the keyframes at-rule visitor is called on each keyframes at-rule node. the visitor can be a function or an object with a property named after the keyframes at-rule prelude.

```ts

import {transform} from "@tbela99/css-parser";
const css = `
@keyframes slide-in {
  from {
    transform: translateX(0%);
  }

  to {
    transform: translateX(100%);
  }
}
@keyframes identifier {
  0% {
    top: 0;
    left: 0;
  }
  30% {
    top: 50px;
  }
  68%,
  72% {
    left: 50px;
  }
  100% {
    top: 100px;
    left: 100%;
  }
}
   `;

const result = await transform(css, {
    removePrefix: true,
    beautify: true,
    visitor: {
        KeyframesAtRule: {
            slideIn(node) {
                node.val = 'slide-in-out';
                return node;
            }
        }
    }
});

```

### Value visitor

the value visitor is called on each token of the selector node, declaration value and the at-rule prelude, etc.

### Generic visitor

generic token visitor is a function whose name is a keyof [EnumToken](../docs/enums/node.EnumToken.html). it is called for every token of the specified type.

```ts

import {transform, parse, parseDeclarations} from "@tbela99/css-parser";
const options: ParserOptions = {

    inlineCssVariables: true,
    visitor: {

        // Stylesheet node visitor
        StyleSheetNodeType: async (node) => {

            // insert a new rule
            node.chi.unshift(await parse('html {--base-color: pink}').then(result => result.ast.chi[0]))
        },
        ColorTokenType:  (node) => {

            // dump all color tokens
            // console.debug(node);
         },
         FunctionTokenType:  (node) => {

             // dump all function tokens
             // console.debug(node);
         },
         DeclarationNodeType:  (node) => {

             // dump all declaration nodes
             // console.debug(node);
         }
    }
};

const css = `

body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
`;

console.debug(await transform(css, options));

// body {color:#f3fff0}
```

------
[Previous](./minification.md) | [Next](./ast.md) 