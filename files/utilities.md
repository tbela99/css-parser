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

# CSS Parsing utility functions

`css-parser` offers several helper functions to help you parse CSS.

## Parsing CSS values

[parseString()](../functions/node.parseString.html) is used to parse CSS values.

```ts
import {parseString} from '@tbela99/css-parser';

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

## Parse CSS declarations

[parseDeclarations()](../functions/node.parseDeclarations.html) is used to parse a CSS string representing declarations.

```ts
import {parseDeclarations} from '@tbela99/css-parser';

const values = parseDeclarations(`width: 2px; background: linear-gradient(to bottom, white, black) color-mix(red, green)`);

console.debug(values[0]); // first declaration
console.debug(values[1]); // second declaration

```

## Parse CSS rules and at-rules

CSS rules and at-rules are parsed using [parse()](../functions/node.parse.html) and [parseSync()](../functions/node.parseSync.html) functions.

```ts
import {parseSync} from '@tbela99/css-parser';

const values = parseSync(`
.s {width: 2px; background: linear-gradient(to bottom, white, black) color-mix(red, green)
}
.g {width: 2px; background: linear-gradient(to bottom, white, black) color-mix(red, green)
}
`).ast.chi;

console.debug(values[0]); // first rule
console.debug(values[1]); // second rule

```

------
[← Ast Manipulation](./ast.md) | [Node Module →](../docs/modules/node.html)