---
title: Custom Transform
group: Documents
category: Guides
---

## Custom transform

Visitors are used to transform the ast tree produced by the parser. For more information about the visitor object see the [typescript definition](../docs/interfaces/node.VisitorNodeMap.html). You can register handlers for specific AST node types and lifecycle events such as enter, visit, and leave to inspect, validate, or modify nodes without altering the parser internals.

Visitor handlers receive the node and the [arena](../docs/classes/node.AstArena.html) the node is allocated in: `handler(node, arena, parent, root)`.
Ast nodes are node ids (numbers) and are read / modified through the arena, value tokens are plain objects.
A handler returning a node id, an array of node ids (or tokens for value visitors) replaces the visited node. New nodes must be allocated in the arena
(`arena.createDeclaration()`, `arena.createRule()`, `arena.createAtRule()`, `arena.clone()`, `arena.import()`, [parseDeclarations()](../docs/functions/node.parseDeclarations.html)).

This pattern is useful for building reusable plugins that enforce conventions, inject transformations, or add custom analysis on top of the parsed AST.

## Visitors syntax

A visitor can be specified as a function whose name is a keyof EnumToken. All tokens of that kind will be visited.

```ts

import {transformSync} from "@tbela99/css-parser;

function UrlFunctionTokenType(node) {

    // ...
    console.debug(node);
}

const options = {

    visitor: UrlFunctionTokenType,
    input: `.selector {
            
        /* associated properties */
        background-image: url("star.gif");
        list-style-image: url('../images/bullet.jpg');
        content: url("my-icon.jpg");
        cursor: url(my-cursor.cur);
        border-image-source: url(/media/diamonds.png);
        src: url('fantastic-font.woff');
        offset-path: url(#path);
        mask-image: url("masks.svg#mask1");

        /* Properties with fallbacks */
        cursor: url(pointer.cur), pointer;
    }`
}

const result = transformSync(options);

// ...
```

If you need the visitor to run when the node is entered or exited, you will use this syntax:

```ts

import {transformSync, WalkerEvent} from "@tbela99/css-parser;

const visitor = {
    UrlFunctionTokenType: {
        type: WalkerEvent.Enter,
        handler(node) {
            // ...
            console.debug(node);
        },
    },
    AngleTokenType: {
        type: WalkerEvent.Leave,
        handler(node) {
            // ...
            console.debug(node);
        },
    },
};

const options = {
    visitor,
    input: `.selector {
            
        /* associated properties */
        background-image: url("star.gif");
        list-style-image: url('../images/bullet.jpg');
        content: url("my-icon.jpg");
        cursor: url(my-cursor.cur);
        border-image-source: url(/media/diamonds.png);
        src: url('fantastic-font.woff');
        offset-path: url(#path);
        mask-image: url("masks.svg#mask1");

        /* Properties with fallbacks */
        cursor: url(pointer.cur), pointer;
    }`
}

const result = transformSync(options);

// ...
```

It is also possible to visit all nodes by providing a function as the visitor property.

```ts
import {transformSync} from '@tbela99/css-parser';

 const options = {
            input: `
    
    button {
            	line-height: 2.5 !important;
            	line-height: 1.5;
            }
    `,
            beautify: true,
// visit all nodes and value tokens
  visitor (node, arena) {
      
    // ast nodes and value tokens are ids
    console.error(EnumToken[arena.dataTypes[node]]);
  }
        };

  const result = transformSync(options);
  console.debug(result.code);
```

## Visitors execution order

Visitors can be called when the node is entered, visited or exited.

```ts

const options: ParserOptions = {
    
    visitor: [
        {

            AtRule: [
                // called when entering a node
                {
                    type: WalkerEvent.Enter,
                    handler: (node: AstAtRule, arena: AstArena): AstAtRule => {

                        console.error(`> enter '@${arena.getName(node)}' node at position ${arena.getLocation(node)!.sta}`);
                        return node
                    }
                },
                // called when leaving a node
                {

                    type: WalkerEvent.Leave,
                    handler: (node: AstAtRule, arena: AstArena): AstAtRule => {

                        console.error(`> leaving '@${arena.getName(node)}' node at position ${arena.getLocation(node)!.sta}`)
                        return node
                    }
                },
                // called after node enter handlers but before node leave handlers
                (node: AstAtRule, arena: AstArena): AstAtRule => {

                    console.error(`> visiting '@${arena.getName(node)}' node at position ${arena.getLocation(node)!.sta}`);
                    return node
                }
        }
            ]
        }
    ]
}
```

### Examples
```ts

import {AstArena, AstAtRule, ParserOptions, transform, VisitorNodeMap, WalkerEvent} from "@tbela99/css-parser";
const options: ParserOptions = {

    visitor: [
        {

            AtRule: [
                (node: AstAtRule, arena: AstArena): AstAtRule => {

                    console.error(`> visiting '@${arena.getName(node)}' node at position ${arena.getLocation(node)!.sta}`);
                    return node
                }, {

                    media: (node: AstAtRule, arena: AstArena): AstAtRule => {

                        console.error(`> visiting only '@${arena.getName(node)}' node at position ${arena.getLocation(node)!.sta}`);
                        return node
                    }
                }, {

                    type: WalkerEvent.Leave,
                    handler: (node: AstAtRule, arena: AstArena): AstAtRule => {

                        console.error(`> leaving '@${arena.getName(node)}' node at position ${arena.getLocation(node)!.sta}`)
                        return node
                    }
                },
                {
                    type: WalkerEvent.Enter,
                    handler: (node: AstAtRule, arena: AstArena): AstAtRule => {

                        console.error(`> enter '@${arena.getName(node)}' node at position ${arena.getLocation(node)!.sta}`);
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

## At-rule visitor

Example: change media at-rule prelude

```ts

import {transform, AstArena, AstAtRule, ParserOptions} from "@tbela99/css-parser";
const options: ParserOptions = {

    visitor: {

        AtRule: {

            media: (node: AstAtRule, arena: AstArena): AstAtRule => {

                arena.setValueString(node, 'tv,screen');
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

import {transform, AstArena, AstDeclaration, EnumToken, ParserOptions} from "@tbela99/css-parser";
const options: ParserOptions = {

    removeEmpty: false,
    visitor: {

        Declaration: {

            // called only for height declaration
            height: (node: AstDeclaration, arena: AstArena): AstDeclaration[] => {
                
                return [
                    node,
                    // new nodes are allocated in the arena
                    arena.createDeclaration(EnumToken.DeclarationNodeType, 'width', [
                        arena.createToken(EnumToken.LengthTokenType, 3, 'px')
                    ], null, null)
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

import {AstArena, AstDeclaration, ParserOptions, transform} from "@tbela99/css-parser";
const options: ParserOptions = {

    visitor: {

        // called for every declaration
        Declaration: (node: AstDeclaration, arena: AstArena): null => {


            if (arena.getName(node) == 'height') {

                arena.setNameString(node, 'width');
            }

            else if (arena.getName(node) == 'margin') {

                arena.setNameString(node, 'padding');
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

import {transform, parseDeclarations, AstArena, AstRule, ParserOptions} from "@tbela99/css-parser";
const options: ParserOptions = {

    removeEmpty: false,
    visitor: {

        Rule: (node: AstRule, arena: AstArena): AstRule | null => {

            if (arena.getSelector(node) == '.foo') {

                // the declarations are parsed in the same arena
                arena.appendChildren(node, ...parseDeclarations('width: 3px', arena).nodes);
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

Keyframes rule visitor is called on each keyframes rule node.

### KeyframesAtRule visitor

The keyframes at-rule visitor is called on each keyframes at-rule node. The visitor can be a function or an object with a property named after the keyframes at-rule prelude.

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
            slideIn(node, arena) {
                arena.setValueString(node, 'slide-in-out');
                return node;
            }
        }
    }
});

```

### Value visitor

The value visitor is called on each token of the selector node, declaration value and the at-rule prelude, etc.

```ts

import {AstArena, AstAtRule, ParserOptions, transform, VisitorNodeMap, WalkerEvent} from "@tbela99/css-parser";
const options: ParserOptions = {

    visitor:  {

        Value: (node: Token, arena: AstArena): Token => {

            console.error(`> visiting token ${EnumToken[arena.dataTypes[node]]}`);
            return node
        }
    } as VisitorNodeMap
};
```
### Generic visitor

Generic token visitor is a function whose name is a keyof [EnumToken](../docs/enums/node.EnumToken.html). it is called for every token of the specified type.

```ts

import {transform, parse, parseDeclarations} from "@tbela99/css-parser";
const options: ParserOptions = {

    inlineCssVariables: true,
    visitor: {

        // Stylesheet node visitor
        StyleSheetNodeType: async (node, arena) => {

            // insert a new rule. nodes of another arena are imported
            const result = await parse('html {--base-color: pink}');
            arena.prependChildren(node, arena.import(result.arena, result.arena.firstChild[result.ast]));
        },
        ColorTokenType:  (node, arena) => {

            // dump all color tokens
            // console.debug(arena.toObject(node));
         },
         FunctionTokenType:  (node, arena) => {

             // dump all function tokens
             // console.debug(arena.toObject(node));
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
[← Minification](./minification.md) | [Sourcemap →](./sourcemap.md) 