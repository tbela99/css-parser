---
title: Utility Functions
group: Documents
category: Guides
---

# Color manipulation

```ts
import {parseString, convertColor, getColorComponents, renderValue, okLabDistance, isOkLabClose} from '@tbela99/css-parser';
import type {ColorToken} from '@tbela99/css-parser';

const color = parseString(`color-mix(red, green)`)[0] as ColorToken;

// get color components
const components = getColorComponents(color);
// do something with the color components ...

// convert to SRGB color space
const srgbColor = convertColor(color, ColorType.SRGB) as ColorToken;

// render value token
const srgbColorString = renderValue(srgbColor, { convertColor: false });
console.debug(srgbColorString);
// color(srgb .651595 .412381 .000822)

// calculate the color distance
const distance = okLabDistance(color, srgbColor);
// ...

// are colors visually close?
console.debug(isOkLabClose(color, srgbColor));
```

# Ast utility functions

## cloneNode()

[Clone](../functions/node.cloneNode.html) an ast node.

```ts

import {cloneNode, walk} from '@tbela99/css-parser';

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

const result = await parse(css);

// deep clone
const clonedAst = cloneNode(result.ast, true);
```


### replaceNodeOrValue()

The function [replaceNodeOrValue()](../functions/node.replaceNodeOrValue.html) replaced a node in the specified parent. Throws an error if the target node is not found in the parent.

```ts
replaceNodeOrValue(parent: Token, target: Token, replacement: Tokan | Token[]);
```

# Parsing utility functions
## Parsing CSS string

Parse a CSS string using [parseString()]().

```ts
import {parseString} from '@tbela99/css-parser';

const css = `linear-gradient(to bottom, white, black)`;

const values = parseString(`linear-gradient(to bottom, white, black) color-mix(red, green)`);

console.debug(values[0]); // image function
console.debug(values[2]); // color function

// {
//   typ: 19,
//   val: "linear-gradient",
//   loc: {
//     src: "",
//     sta: {
//       ind: 0,
//       lin: 1,
//       col: 1,
//     },
//     end: {
//       ind: 15,
//       lin: 1,
//       col: 16,
//     },
//   },
//   chi: [
//     {
//       typ: 7,
//       val: "to",
// ...
```

------
[← Ast Manipulation](./ast.md) | [Node Module →](../docs/modules/node.html)