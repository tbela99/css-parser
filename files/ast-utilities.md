---
title: Ast Utilities
group: Documents
category: Guides
---

## cloneNode()

Clone an ast node

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


### replaceNodeOrValue()

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

```



------
[← Ast Traversal](./ast-traversal.md) | [Node Module →](../docs/modules/node.html)