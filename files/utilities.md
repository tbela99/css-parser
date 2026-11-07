---
title: Utility Functions
group: Documents
category: Guides
---

# Color manipulation

```ts
import {AstArena, ColorType, parseString, convertColor, renderToken, okLabDistance, isOkLabClose} from '@tbela99/css-parser';

// tokens are allocated in an arena
const arena = new AstArena();
const color = parseString(arena, `color-mix(red, green)`)[0];

// the color function arguments
const components = arena.tokens(color);
// do something with the color components ...

// convert to SRGB color space. the converted color is a new token allocated in the arena
const srgbColor = convertColor(arena, color, ColorType.SRGB) as number;

// render value token
const srgbColorString = renderToken(arena, srgbColor, { convertColor: false });
console.debug(srgbColorString);
// color(srgb .651595 .41238 .000819)

// calculate the color distance
const distance = okLabDistance(arena, color, srgbColor);
// ...

// are colors visually close?
console.debug(isOkLabClose(arena, color, srgbColor));
```

# Ast utility functions

## arena.clone()

[Clone](../classes/node.AstArena.html#clone) an ast node. The clone is allocated in the same arena, detached, and
returned as a node id. The children are cloned too when `deep` is true.

```ts

import {parse} from '@tbela99/css-parser';

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
const clonedAst = result.arena.clone(result.ast, true);
```


### replaceNode()

The function [replaceNode()](../functions/node.replaceNode.html) replaces an ast node in its parent with one or more nodes.

```ts
import {parse, replaceNode, render} from '@tbela99/css-parser';

const result = await parse(`.foo { color: red } .bar { color: blue }`);
const arena = result.arena;
const [foo, bar] = arena.children(result.ast);

replaceNode(arena, foo, arena.clone(bar, true));

console.debug(render(arena, result.ast).code); // .bar{color:blue}.bar{color:blue}
```

### replaceNodeOrValue()

The function [replaceNodeOrValue()](../functions/node.replaceNodeOrValue.html) replaces a value token in its parent token or in the values of an ast node
(the parent is `arena.getValueParent(target)`). Throws an error if the target token is detached.

```ts
replaceNodeOrValue(arena: AstArena, target: Token, replacement: Token | Token[]);
```

```ts
import {parse, replaceNodeOrValue, render, EnumToken} from '@tbela99/css-parser';

const result = await parse(`.foo { width: calc(1px + 2px) }`);
const arena = result.arena;
const declaration = arena.getFirstChild(arena.getFirstChild(result.ast));

// replace the first value token
replaceNodeOrValue(arena, arena.getFirstToken(declaration), arena.createToken(EnumToken.LengthTokenType, 3, 'px'));

console.debug(render(arena, result.ast).code); // .foo{width:3px}
```

# CSS Parsing utility functions

`css-parser` offers several helper functions to help you parse CSS.

## Parsing CSS values

[parseString()](../functions/node.parseString.html) is used to parse CSS values. The tokens are allocated in the arena
passed as the first argument and returned as ids.

```ts
import {AstArena, parseString} from '@tbela99/css-parser';

const arena = new AstArena();
const values = parseString(arena, `linear-gradient(to bottom, white, black) color-mix(red, green)`);

console.debug(arena.toObject(values[0])); // image function
console.debug(arena.toObject(values[2])); // color function

// {
//   typ: 19,
//   val: "linear-gradient",
//   chi: [
//     {
//       typ: 7,
//       val: "to",
//     },
//     {
//       typ: 36,
//     },
//     {
//       typ: 7,
//       val: "bottom",
//     },
// ...
```

## Parse CSS declarations

[parseDeclarations()](../functions/node.parseDeclarations.html) is used to parse a CSS string representing declarations.

```ts
import {parseDeclarations} from '@tbela99/css-parser';

// the declarations are allocated in the arena passed as the second argument, or in a new arena
const {arena, nodes} = parseDeclarations(`width: 2px; background: linear-gradient(to bottom, white, black) color-mix(red, green)`);

console.debug(arena.toObject(nodes[0])); // first declaration
console.debug(arena.toObject(nodes[1])); // second declaration

```

## Parse CSS rules and at-rules

CSS rules and at-rules are parsed using [parse()](../functions/node.parse.html) and [parseSync()](../functions/node.parseSync.html) functions.

```ts
import {parseSync} from '@tbela99/css-parser';

const result = parseSync(`
.s {width: 2px; background: linear-gradient(to bottom, white, black) color-mix(red, green)
}
.g {width: 2px; background: linear-gradient(to bottom, white, black) color-mix(red, green)
}
`);

const values = result.arena.children(result.ast);

console.debug(result.arena.toObject(values[0])); // first rule
console.debug(result.arena.toObject(values[1])); // second rule

```

------
[← Arena Memory](./arena.md) | [Migration →](./migration.md)