---
title: Ast Manipulation
group: Documents
category: Guides
---

## Ast node types

The ast root node returned by the parser is always a [AstStyleSheet](../docs/interfaces/node.AstStyleSheet.html) node.
The other node types
are [AstRule](../docs/interfaces/node.AstRule.html), [AstAtRule](../docs/interfaces/node.AstAtRule.html), [AstKeyframesAtRule](../docs/interfaces/node.AstKeyframesAtRule.html), [AstKeyframesRule](../docs/interfaces/node.AstKeyframesRule.html), [AstDeclaration](../docs/interfaces/node.AstDeclaration.html), [AstComment](../docs/interfaces/node.AstComment.html).

Common properties are:
- typ: [EnumToken](../enums/node.EnumToken.html). The node type
- state: [EnumAstNodeStatus](../enums/node.EnumAstNodeStatus.html). The node's validation state
- errors: the node validation errors.

The full list of tokens is available [here](../interfaces/node.BaseToken.html).

## Ast node values

Nodes values are parsed as an array of tokens accessed through the `val` for AstDeclaration and `tokens` property for the other node types.

### Ast rule value

[Ast rule](../docs/interfaces/node.AstRule.html) value is the selector parsed as the  _tokens_ pwhich is an array of [Token](../docs/types/node.Token.html) .
The _sel_ attribute is the string representation of the node selector.
Modifying the sel attribute does not affect the tokens attribute, and similarly, changes to the tokens attribute do not
update the sel attribute.

```ts

import {AstRule, parseDeclarations, ParserOptions, transform, parseDeclarations} from '@tbela99/css-parser';

const options: ParserOptions = {

    visitor: {

        async Rule(node: AstRule): AstRule {

            node.sel = '.foo,.bar,.fubar';

            node.chi.push(...await parseDeclarations('width: 3px'));
            return node;
        }
    }
};

const css = `

    .foo {

            height: calc(100px * 2/ 15);    
    } 
`;

const result = await transform(css, options);
console.debug(result.code);

// .foo,.bar,.fubar{height:calc(40px/3);width:3px}
```

### Ast at-rule value

[Ast at-rule](../docs/interfaces/node.AstAtRule.html) _tokens_ is either null or an array
of [Token](../docs/types/node.Token.html) representing the node's prelude.
The _val_ attribute is the string representation of the node's value.

Modifying the _val_ attribute does not affect the _tokens_ attribute, and similarly, changes to the _tokens_ attribute do not
update the _val_ attribute.

```ts
import {ParserOptions, transform, AstAtRule} from '@tbela99/css-parser';

const options: ParserOptions = {

    visitor: {

        AtRule: {

            media: (node: AstAtRule): AstAtRule => {

                node.val = 'all';
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

// .foo{height:calc(40px/3)}
```

### Ast declaration value

[Ast declaration](../docs/interfaces/node.AstDeclaration.html) _nam_ attribute is the declaration name. the _val_
attribute is an array of [Token](../docs/types/node.Token.html) representing the declaration's value.

```ts

import {AstDeclaration, EnumToken, LengthToken, ParserOptions, transform} from '@tbela99/css-parser';

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

const result = await transform(css, options);
console.debug(result.code);

// .foo{height:calc(40px/3);width:3px}.selector{color:#0880b0}
```
## Ast Traversal


### walk()

Ast traversal is achieved using [walk()](../docs/functions/node.walk.html)

```ts

import {walk} from '@tbela99/css-parser';

const css = `
body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }

html,
body {
    line-height: 1.474;
}

.ruler {

    height: 10px;
}
`;

for (const {node, parent, root} of walk(ast)) {

    // do something with node
}
```

Ast traversal can be controlled using a [filter](../docs/media/node.walk.html#walk) function. the filter function returns a value of type [WalkerOption](../docs/types/node.WalkerOption.html).
if the filter function returns new nodes, those will also be visited.

```ts

import {EnumToken, transform, walk, WalkerOptionEnum} from '@tbela99/css-parser';

const css = `
body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }

html,
body {
    line-height: 1.474;
}

.ruler {

    height: 10px;
}
`;

function filter(node) {

    if (node.typ == EnumToken.AstRule && node.sel.includes('html')) {

        // skip the children of the current node
        return WalkerOptionEnum.IgnoreChildren;
    }
}

const result = await transform(css);
for (const {node} of walk(result.ast, filter)) {

    console.error([EnumToken[node.typ]]);
}

// [ "StyleSheetNodeType" ]
// [ "RuleNodeType" ]
// [ "DeclarationNodeType" ]
// [ "RuleNodeType" ]
// [ "DeclarationNodeType" ]
// [ "RuleNodeType" ]
// [ "DeclarationNodeType" ]

```

### walkValues()
The [`walkValues()`](../docs/functions/node.walkValues.html) function traverses the value tokens of a node, allowing you to inspect or modify each token during traversal.

```ts

import {AstDeclaration, EnumToken, transform, walkValues} from '@tbela99/css-parser';

const css = `
body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
`;

const result = await transform(css);
const declaration = result.ast.chi[0].chi[0] as AstDeclaration;

// walk the node attribute's tokens in reverse order
for (const {value} of walkValues(declaration.val, null, null,true)) {

    console.error([EnumToken[value.typ], value.val]);
}

// [ "Color", "color" ]
// [ "FunctionTokenType", "calc" ]
// [ "Number", 0.15 ]
// [ "Add", undefined ]
// [ "Iden", "b" ]
// [ "Whitespace", undefined ]
// [ "FunctionTokenType", "calc" ]
// [ "Number", 0.24 ]
// [ "Add", undefined ]
// [ "Iden", "g" ]
// [ "Whitespace", undefined ]
// [ "Iden", "r" ]
// [ "Whitespace", undefined ]
// [ "Iden", "display-p3" ]
// [ "Whitespace", undefined ]
// [ "FunctionTokenType", "var" ]
// [ "DashedIden", "--base-color" ]
// [ "Whitespace", undefined ]
// [ "Iden", "from" ]
```

### find()

Searches the AST and returns the first node that matches the specified criteria.
  
 ```ts
  // find the first ast declaration node which name is 'aspect-ratio'
import { find, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode) =>
      return node.typ == EnumToken.DeclarationNodeType && (node as AstDeclaration).nam == 'aspect-ratio'; 

     const result  = await transform(css);     
     const node = find(result.ast, nodeMatcher);

     console.log({node});
 
```

### findByValue()

Searches the AST by traversing each node's value tokens and returns the first node with a matching value token.
  
 ```ts
// find the first ast node which contains the length token '30px'
import { findByValue, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contains the length token '30px'
  const nodeMatcher = (value: Token) =>
      return value.typ == EnumToken.LengthTokenType && (value as LengthToken).val == 30 && (value as LengthToken).unit == 'px' ; 

     const result  = await transform(css);     
     const { node, value } = findByValue(result.ast, nodeMatcher) ?? {};

     console.log({node, value});
 
```

### findAll()

Searches the AST and returns all nodes that match the specified criteria.
  
 ```ts
 // find the first ast declaration node which name is 'aspect-ratio'
import { findAll, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode) =>
      return node.typ == EnumToken.DeclarationNodeType && (node as AstDeclaration).nam == 'aspect-ratio'; 

     const result  = await transform(css);     
     const nodes = findAll(result.ast, nodeMatcher);

     console.log({nodes});
 
```

### findLast()

Search the ast tree and return the last node matching the specified criteria.
  
 ```ts
 *  // find the first ast declaration node which name is 'aspect-ratio'
import { findLast, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

 * const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode) =>
      return node.typ == EnumToken.DeclarationNodeType && (node as AstDeclaration).nam == 'aspect-ratio'; 

     const result  = await transform(css);     
     const node = findLast(result.ast, nodeMatcher);

     console.log({node});
```

### findValue()

Find the node's value token of the specified ast node that matches the specified criteria.
  
 ```ts
// find the first ast declaration node which name is 'aspect-ratio'
import { findValue, EnumToken, transform } from "@tbela99/css-parser";
import type { AstNode } from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode) =>
      return node.typ == EnumToken.DeclarationNodeType && (node as AstDeclaration).nam == 'aspect-ratio'; 

     const result  = await transform(css);     
     const found = findValue(result.ast.chi[0], nodeMatcher);

     console.log({found}); // 'button' token of the selector
  
```

------
[← Syntax Lowering](./syntax-lowering.md) | [Utility Functions →](./utilities.md)