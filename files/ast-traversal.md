---
title: Ast Traversal
group: Documents
category: Guides
---

## walk()

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

The function [walkValues()](../docs/functions/node.walkValues.html) is used to walk the node attribute's tokens.

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

Search the ast tree and return the first match.
  
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

Search the ast tree by checking each node's value token and return the first match.
  
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

 // find declaration which contain the length token '30px'
  const nodeMatcher = (value: Token) =>
      return value.typ == EnumToken.LengthTokenType && (value as LengthToken).val == 30 && (value as LengthToken).unit == 'px' ; 

     const result  = await transform(css);     
     const { node, value } = findByValue(result.ast, nodeMatcher) ?? {};

     console.log({node, value});
 
```

### findAll()

Search the ast tree and return all matches.
  
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

Search the ast tree and return the last match.
  
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

Find the node's value token of the specified ast node
  
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
[← Ast](./ast.md) | [Ast Utilities →](./ast-utilities.md)