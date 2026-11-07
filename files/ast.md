---
title: Ast Manipulation
group: Documents
category: Guides
---

## Arena memory layout

Ast nodes are not JavaScript objects. They are allocated in an arena ([AstArena](../docs/classes/node.AstArena.html))
and referenced by their **node id**, an integer. The node data is stored column-wise in typed arrays
(a _structure of arrays_): the type of the node `n` is `arena.dataTypes[n]`, its parent is `arena.parents[n]`, etc.
Children are stored as doubly linked lists (`firstChild`, `lastChild`, `nextSibling`, `previousSibling`) and the
strings (selectors, at-rule names, declaration names) are interned in `arena.strings`.

Every function that works with ast nodes takes the arena as its first argument and node ids instead of node objects.
Both are returned by [parse()](../docs/functions/node.parse.html) and [transform()](../docs/functions/node.transform.html).

```ts
import {parse, render, EnumToken} from '@tbela99/css-parser';

const result = await parse(`.foo { color: red }`);
const arena = result.arena;
const stylesheet = result.ast; // node id

// the first child of the stylesheet
const rule = arena.firstChild[stylesheet];

console.debug(arena.dataTypes[rule] == EnumToken.RuleNodeType); // true
console.debug(arena.strings[arena.name[rule]]); // '.foo'
console.debug(arena.getSelector(rule)); // '.foo'

const declaration = arena.firstChild[rule];

console.debug(arena.getName(declaration)); // 'color'

// the value tokens are ids too
const token = arena.firstToken[declaration];

console.debug(arena.dataTypes[token] == EnumToken.ColorTokenType); // true
console.debug(arena.str(token)); // 'red'
console.debug(arena.tokens(declaration)); // [token]

console.debug(render(arena, stylesheet).code); // .foo{color:red}
```

Value tokens ([Token](../docs/types/node.Token.html)) are ids allocated in the same arena: the declaration values,
the rule selector tokens and the at-rule prelude tokens are stored in the _token list_ of the node (`arena.tokens(n)`).
The parser never allocates token objects: the tokenizer output is written directly into the arena columns.

### Arena columns

| Column                     | Description                                                                      |
|----------------------------|----------------------------------------------------------------------------------|
| `arena.dataTypes[n]`       | node type ([EnumToken](../docs/enums/node.EnumToken.html))                      |
| `arena.parents[n]`         | parent node id, `0` when the node is detached                                    |
| `arena.firstChild[n]`      | first child id, `0` when empty                                                   |
| `arena.lastChild[n]`       | last child id                                                                    |
| `arena.nextSibling[n]`     | next sibling id                                                                  |
| `arena.previousSibling[n]` | previous sibling id                                                              |
| `arena.firstToken[n]`      | first token id of the token list (declaration values, selector / prelude tokens, function arguments), `0` when empty |
| `arena.lastToken[n]`       | last token id                                                                    |
| `arena.name[n]`            | interned string id of the rule selector, the at-rule name or the declaration name |
| `arena.stringValue[n]`     | interned string id of the at-rule prelude, the comment or the token string value (identifier, string, function name, color name, ...) |
| `arena.numericValue[n]`    | numeric value of number, dimension and percentage tokens. The operator of binary expressions |
| `arena.unit[n]`            | interned string id of the dimension unit                                         |
| `arena.colorType[n]`       | color type of color tokens ([ColorType](../docs/enums/node.ColorType.html)), `ColorType.NONE` until the color is parsed |
| `arena.strings[id]`        | interned strings                                                                 |
| `arena.flags[n]`           | validation state ([EnumAstNodeStatus](../docs/enums/node.EnumAstNodeStatus.html)) and node flags |
| `arena.errors`             | validation errors (`Map<node id, ErrorDescription[]>`)                           |

The node location is packed in `arena.spans[n]` and is read with `arena.getLocation(n)`, `arena.getSource(n)`,
`arena.getSpanStart(n)` and `arena.getSpanEnd(n)`.

Tokens and nodes share the same columns: a token list is a doubly linked list (`firstToken`, `lastToken`, `nextSibling`, `previousSibling`)
and the parent of a token is the node or the token that owns the list (`arena.parents[token]`).

### Node types

The ast root node returned by the parser is always a stylesheet node (`EnumToken.StyleSheetNodeType`).
The other node types are rules (`EnumToken.RuleNodeType`), at-rules (`EnumToken.AtRuleNodeType`),
keyframes at-rules (`EnumToken.KeyframesAtRuleNodeType`), keyframes rules (`EnumToken.KeyframesRuleNodeType`),
declarations (`EnumToken.DeclarationNodeType`) and comments (`EnumToken.CommentNodeType`).

The node type aliases [AstStyleSheet](../docs/types/node.AstStyleSheet.html), [AstRule](../docs/types/node.AstRule.html),
[AstAtRule](../docs/types/node.AstAtRule.html), [AstDeclaration](../docs/types/node.AstDeclaration.html), ... are all
aliases of `number`.

### Reading and writing nodes

| Data                | Read                                      | Write                                  |
|---------------------|-------------------------------------------|----------------------------------------|
| rule selector       | `arena.getSelector(n)`                    | `arena.setSelector(n, '.foo,.bar')`    |
| at-rule name        | `arena.getName(n)`                        | `arena.setNameString(n, 'media')`      |
| at-rule prelude     | `arena.getValue(n)`                       | `arena.setValueString(n, 'screen')`    |
| declaration name    | `arena.getName(n)`                        | `arena.setNameString(n, 'width')`      |
| declaration values  | `arena.tokens(n)`                         | `arena.setTokens(n, ...tokens)`        |
| selector / prelude tokens | `arena.tokens(n)`                   | `arena.setTokens(n, ...tokens)`        |
| validation state    | `arena.getState(n)`                       | `arena.setState(n, state)`             |
| validation errors   | `arena.getErrors(n)`                      | `arena.setErrors(n, errors)`           |
| location            | `arena.getLocation(n)`                    | `arena.setLocation(n, srcId, sta, end)` |

[getNodeProperty()](../docs/functions/node.getNodeProperty.html) and [setNodeProperty()](../docs/functions/node.setNodeProperty.html)
give access to the same data by property name.

### Creating nodes

```ts
import {AstArena, EnumToken, render} from '@tbela99/css-parser';

const arena = new AstArena();
const stylesheet = arena.createStyleSheet();
const rule = arena.createRule(EnumToken.RuleNodeType, '.foo', null, null, null);
const declaration = arena.createDeclaration(
    EnumToken.DeclarationNodeType,
    'width',
    [arena.createToken(EnumToken.LengthTokenType, 3, 'px')],
    null,
    null,
);
const media = arena.createAtRule(EnumToken.AtRuleNodeType, 'media', 'screen', true, null, null, null);

arena.appendChildren(stylesheet, media);
arena.appendChildren(media, rule);
arena.appendChildren(rule, declaration);

console.debug(render(arena, stylesheet).code); // @media screen{.foo{width:3px}}
```

Declarations can also be parsed with [parseDeclarations()](../docs/functions/node.parseDeclarations.html).

### Tree operations

- `arena.children(n)`: the children ids
- `arena.childCount(n)`, `arena.getChildAt(n, index)`, `arena.indexOf(n)`
- `arena.appendChildren(n, ...nodes)`, `arena.prependChildren(n, ...nodes)`, `arena.setChildren(n, ...nodes)`
- `arena.insertBefore(reference, ...nodes)`, `arena.insertAfter(reference, ...nodes)`
- `arena.replaceChild(n, ...nodes)`: replace a node in its parent
- `arena.detach(n)`: remove a node from its parent. the node memory is not reclaimed: node ids are never reused
- `arena.mark(...nodes)`: mark nodes to be released or trimmed later
- `arena.release(n?, deep?)`: detach a node and drop its data (strings, caches, errors). without argument, every marked node is released
- `arena.trim(errors?)`: release the marked nodes, then reclaim the memory of the nodes that are not reachable from the root (see `compact()`)
- `arena.recycle(n)`: reuse the id of a detached leaf node that is no longer referenced (the parser recycles the tokens it does not attach to the tree)
- `arena.clone(n, deep)`: clone a node, see [cloneNode()](../docs/functions/node.cloneNode.html)
- `arena.import(otherArena, n)`: copy a node allocated in another arena
- `arena.compact(errors?)`: drop the nodes and tokens that are not reachable from the root and renumber the ids in document order
  (see [Arena Memory](./arena.md)).
  The library never compacts the arena by itself: detached nodes and the tokens allocated while rendering stay allocated.
  Call `compact()` to reclaim their memory, for example before sending the arena to a worker. The ids obtained before the
  call are no longer valid

A node is always attached to at most one parent: appending a node to a new parent detaches it from its previous parent.

```ts
import {parse, render} from '@tbela99/css-parser';

const result = await parse(`.foo { color: red } .bar { color: blue }`);
const other = await parse(`html { --base-color: pink }`);
const arena = result.arena;

// nodes of another arena are copied
arena.prependChildren(result.ast, arena.import(other.arena, other.arena.firstChild[other.ast]));

// move the first rule at the end
arena.appendChildren(result.ast, arena.getChildAt(result.ast, 1));

console.debug(render(arena, result.ast).code);

// html{--base-color:pink}.bar{color:blue}.foo{color:red}
```

### Transferring an arena to a worker

The node data lives in typed arrays, so an arena can be moved to a worker (and back) without copying the nodes.
[`AstArena.toTransferableArenaObject(arena)`](../docs/classes/node.AstArena.html#totransferablearenaobject) returns the
structured-cloneable properties of the arena (interned strings, validation errors, sources, ...) and the list of its
column buffers ([ArenaProperties](../docs/interfaces/node.ArenaProperties.html) and [ArenaTransferables](../docs/types/node.ArenaTransferables.html)).
Pass the buffers as the transfer list of `postMessage()` to move them (zero copy): the source arena is detached and must not
be used afterwards (`arena.transferred` is `true`). The buffers are copied when the transfer list is omitted.

[`AstArena.fromTransferableArenaObjects(properties, transferables)`](../docs/classes/node.AstArena.html#fromtransferablearenaobjects)
creates an arena whose columns are views on the received buffers. Node ids are unchanged: the `ast` id can be sent along.

```ts
// main thread
import {AstArena, parse, render} from '@tbela99/css-parser';

const result = await parse(css);
const [properties, transferables] = AstArena.toTransferableArenaObject(result.arena);

// the buffers are moved to the worker, the properties are cloned
worker.postMessage({ast: result.ast, properties, transferables}, transferables);

worker.onmessage = (event) => {

    // the arena comes back
    const arena = AstArena.fromTransferableArenaObjects(event.data.properties, event.data.transferables);

    console.debug(render(arena, event.data.ast).code);
};
```

```ts
// worker
import {AstArena, EnumToken, walk} from '@tbela99/css-parser';

self.onmessage = (event) => {

    const {ast, properties, transferables} = event.data;
    const arena = AstArena.fromTransferableArenaObjects(properties, transferables);

    // the arena is fully functional
    for (const {node} of walk(arena, ast)) {

        if (arena.dataTypes[node] == EnumToken.RuleNodeType) {

            arena.setSelector(node, arena.getSelector(node) + ':hover');
        }
    }

    // send the arena back
    const [outProperties, outTransferables] = AstArena.toTransferableArenaObject(arena);

    self.postMessage({ast, properties: outProperties, transferables: outTransferables}, outTransferables);
};
```

The column buffers are listed in the order of `arenaColumns` (`dataTypes`, `parents`, `nextSibling`, `previousSibling`,
`firstToken`, `lastToken`, `firstChild`, `lastChild`, `name`, `stringValue`, `numericValue`, `unit`, `flags`, `colorType`, `spans`).
The same methods exist on the base `Arena` class.

### Plain objects

`arena.toObject(n)` converts a node or a token (and its children) to a plain object tree (`{typ, sel, chi, ...}`,
see [PlainAstNode](../docs/interfaces/node.PlainAstNode.html) and [PlainToken](../docs/types/node.PlainToken.html)) for debugging or
serialization. `arena.fromObject(object)` allocates the nodes and the tokens of a plain object tree in the arena. These helpers are not
used by the library itself: every api works with ids.

## Tokens

Tokens are ids allocated in the arena. The token type is `arena.dataTypes[t]`, its string value (identifier, string, function name,
color name, ...) is `arena.str(t)`, its numeric value `arena.numericValue[t]` and its unit `arena.getUnit(t)`.

```ts
import {EnumToken, parse, renderToken, TokenField} from '@tbela99/css-parser';

const result = await parse('.foo { width: calc(1px + 2px) }', {minify: false});
const arena = result.arena;
const declaration = arena.firstChild[arena.firstChild[result.ast]];
const calc = arena.firstToken[declaration];

console.debug(EnumToken[arena.dataTypes[calc]]); // 'MathFunctionTokenType'
console.debug(arena.str(calc)); // 'calc'

// the function arguments are the token list of the function token
const expression = arena.firstToken[calc];

console.debug(arena.dataTypes[expression] == EnumToken.BinaryExpressionTokenType); // true
console.debug(arena.numericValue[expression] == EnumToken.Add); // true: the operator of a binary expression
console.debug(arena.numericValue[arena.field(expression, TokenField.L)]); // 1
console.debug(arena.getUnit(arena.field(expression, TokenField.R))); // 'px'

console.debug(renderToken(arena, calc)); // calc(1px + 2px)
console.debug(arena.toObject(calc)); // {typ: EnumToken.MathFunctionTokenType, val: 'calc', chi: [{typ: EnumToken.BinaryExpressionTokenType, op: EnumToken.Add, l: {...}, r: {...}}]}
```

[parseString()](../docs/functions/node.parseString.html) parses a css value into tokens allocated in the given arena:

```ts
import {AstArena, EnumToken, parseString} from '@tbela99/css-parser';

const arena = new AstArena();
const tokens = parseString(arena, 'linear-gradient(to bottom, white, black) red');

console.debug(tokens.map((t) => EnumToken[arena.dataTypes[t]])); // ['ImageFunc', 'Whitespace', 'Color']
console.debug(arena.tokens(tokens[0]).map((t) => arena.str(t))); // ['to', '', 'bottom', '', 'white', '', 'black']
```

| Token data            | Read                                         | Write                                         |
|-----------------------|----------------------------------------------|-----------------------------------------------|
| type                  | `arena.dataTypes[t]`                         | `arena.dataTypes[t] = EnumToken.IdenTokenType` |
| string value          | `arena.str(t)`, `arena.getValue(t)`          | `arena.setStr(t, 'red')`                      |
| numeric value         | `arena.numericValue[t]`                      | `arena.numericValue[t] = 3`                   |
| unit                  | `arena.getUnit(t)`                           | `arena.setUnitString(t, 'px')`                |
| color type            | `arena.colorType[t]`                         | `arena.setColorType(t, ColorType.HEX)`        |
| children (`chi`)      | `arena.tokens(t)`                            | `arena.setTokens(t, ...tokens)`, `arena.appendTokens(t, ...tokens)` |
| structured fields     | `arena.field(t, TokenField.L)`, `arena.fieldTokens(t, TokenField.R)` | `arena.setField(t, TokenField.L, ...tokens)` |
| fraction value        | `arena.hasFraction(t)`, `arena.getFraction(t)` | `arena.setFraction(t, fraction)`            |
| location              | `arena.getLocation(t)`                       | `arena.copyLocation(t, source)`               |

Tokens are created with `arena.createToken(typ, value?, unit?)`, `arena.createColor(name, kin, tokens?)`, `arena.createFunction(typ, name, tokens?)`,
`arena.createList(typ, tokens?)`, `arena.createBinaryExpression(op, l, r)` and `arena.createFraction(l, r)`.

A token belongs to at most one token list: `arena.take(t)` returns the token itself when it is detached and a deep clone otherwise.
`arena.replaceToken(t, ...tokens)` replaces a token in its list.

## Ast node values

### Ast rule value

The rule selector is parsed as the selector tokens (`arena.tokens(n)`, an array of [Token](../docs/types/node.Token.html) ids).
`arena.getSelector(n)` is the string representation of the node selector.
Modifying the selector does not affect the selector tokens, and similarly, changes to the selector tokens do not
update the selector.

```ts

import {AstArena, AstRule, parseDeclarations, ParserOptions, transform} from '@tbela99/css-parser';

const options: ParserOptions = {

    visitor: {

        Rule(node: AstRule, arena: AstArena): AstRule {

            arena.setSelector(node, '.foo,.bar,.fubar');

            // parse the declarations in the same arena
            arena.appendChildren(node, ...parseDeclarations('width: 3px', arena).nodes);
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

The at-rule prelude tokens (`arena.tokens(n)`) is an array of [Token](../docs/types/node.Token.html) ids representing the node's prelude.
`arena.getValue(n)` is the string representation of the node's prelude.

Modifying the prelude string does not affect the prelude tokens, and similarly, changes to the prelude tokens do not
update the prelude string.

```ts
import {AstArena, AstAtRule, ParserOptions, transform} from '@tbela99/css-parser';

const options: ParserOptions = {

    visitor: {

        AtRule: {

            media: (node: AstAtRule, arena: AstArena): AstAtRule => {

                arena.setValueString(node, 'all');
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

`arena.getName(n)` is the declaration name. `arena.tokens(n)` is an array of [Token](../docs/types/node.Token.html) ids
representing the declaration's value.

```ts

import {AstArena, AstDeclaration, EnumToken, ParserOptions, transform} from '@tbela99/css-parser';

const options: ParserOptions = {

    visitor: {

        Declaration: {

            // called only for height declaration
            height: (node: AstDeclaration, arena: AstArena): AstDeclaration[] => {

                return [
                    node,
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

const result = await parse(css);

for (const {node, parent, root, arena} of walk(result.arena, result.ast)) {

    // do something with node
}
```

Ast traversal can be controlled using a [filter](../docs/media/node.walk.html#walk) function. the filter function returns a value of type [WalkerOption](../docs/types/node.WalkerOption.html).
if the filter function returns new nodes, those will also be visited.

```ts

import {AstArena, AstNode, EnumToken, transform, walk, WalkerOptionEnum} from '@tbela99/css-parser';

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

function filter(node: AstNode, arena: AstArena) {

    if (arena.dataTypes[node] == EnumToken.RuleNodeType && arena.getSelector(node).includes('html')) {

        // skip the children of the current node
        return WalkerOptionEnum.IgnoreChildren;
    }
}

const result = await transform(css);
for (const {node, arena} of walk(result.arena, result.ast, filter)) {

    console.error([EnumToken[arena.dataTypes[node]]]);
}

// [ "StyleSheetNodeType" ]
// [ "RuleNodeType" ]
// [ "DeclarationNodeType" ]
// [ "RuleNodeType" ]
// [ "DeclarationNodeType" ]
// [ "RuleNodeType" ]
// [ "DeclarationNodeType" ]

```

The value tokens are visited too when the `attributes` option is set: `walk(arena, node, {attributes: true})`.

### walkValues()
The [`walkValues()`](../docs/functions/node.walkValues.html) function traverses the value tokens of a node, allowing you to inspect or modify each token during traversal.

```ts

import {EnumToken, transform, walkValues} from '@tbela99/css-parser';

const css = `
body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
`;

const result = await transform(css);
const arena = result.arena;
const declaration = arena.firstChild[arena.firstChild[result.ast]];

// walk the node attribute's tokens in reverse order
for (const {value} of walkValues(arena, arena.tokens(declaration), declaration, null, true)) {

    console.error([EnumToken[arena.dataTypes[value]], arena.getValue(value) || arena.numericValue[value]]);
}

// [ "Color", "color" ]
// [ "MathFunctionTokenType", "calc" ]
// [ "Number", 0.15 ]
// [ "Add", 0 ]
// [ "Iden", "b" ]
// [ "Whitespace", 0 ]
// [ "MathFunctionTokenType", "calc" ]
// [ "Number", 0.24 ]
// [ "Add", 0 ]
// [ "Iden", "g" ]
// [ "Whitespace", 0 ]
// [ "Iden", "r" ]
// [ "Whitespace", 0 ]
// [ "Iden", "display-p3" ]
// [ "Whitespace", 0 ]
// [ "WildCardFunctionTokenType", "var" ]
// [ "DashedIden", "--base-color" ]
// [ "Whitespace", 0 ]
// [ "Iden", "from" ]
```

### find()

Searches the AST and returns the first node that matches the specified criteria.
  
 ```ts
  // find the first ast declaration node which name is 'aspect-ratio'
import { find, EnumToken, transform } from "@tbela99/css-parser";
import type { AstArena, AstNode } from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

 // find declaration which contain a '30px'
  const nodeMatcher = (node: AstNode, arena: AstArena) =>
      arena.dataTypes[node] == EnumToken.DeclarationNodeType && arena.getName(node) == 'aspect-ratio'; 

     const result  = await transform(css);     
     const node = find(result.arena, result.ast, nodeMatcher);

     console.log({node});
 
```

### findByValue()

Searches the AST by traversing each node's value tokens and returns the first node with a matching value token.
  
 ```ts
// find the first ast node which contains the length token '30px'
import { findByValue, EnumToken, transform } from "@tbela99/css-parser";
import type { Token } from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

     const result  = await transform(css);
     const arena = result.arena;

     // find declaration which contains the length token '30px'
     const nodeMatcher = (value: Token) =>
         arena.dataTypes[value] == EnumToken.LengthTokenType && arena.numericValue[value] == 30 && arena.getUnit(value) == 'px';

     const { node, value } = findByValue(arena, result.ast, nodeMatcher) ?? {};

     console.log({node, value});
 
```

### findAll()

Searches the AST and returns all nodes that match the specified criteria.
  
 ```ts
 // find all ast declaration nodes which name is 'aspect-ratio'
import { findAll, EnumToken, transform } from "@tbela99/css-parser";
import type { AstArena, AstNode } from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

  const nodeMatcher = (node: AstNode, arena: AstArena) =>
      arena.dataTypes[node] == EnumToken.DeclarationNodeType && arena.getName(node) == 'aspect-ratio'; 

     const result  = await transform(css);     
     const nodes = findAll(result.arena, result.ast, nodeMatcher);

     console.log({nodes});
 
```

### findLast()

Search the ast tree and return the last node matching the specified criteria.
  
 ```ts
 // find the last ast declaration node which name is 'aspect-ratio'
import { findLast, EnumToken, transform } from "@tbela99/css-parser";
import type { AstArena, AstNode } from "@tbela99/css-parser";

 const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

  const nodeMatcher = (node: AstNode, arena: AstArena) =>
      arena.dataTypes[node] == EnumToken.DeclarationNodeType && arena.getName(node) == 'aspect-ratio'; 

     const result  = await transform(css);     
     const node = findLast(result.arena, result.ast, nodeMatcher);

     console.log({node});
```

### findValue()

Find the node's value token of the specified ast node that matches the specified criteria.
  
 ```ts
// find the '30px' token of the width declaration
import { findValue, EnumToken, transform } from "@tbela99/css-parser";
import type { Token } from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
    `;

     const result  = await transform(css);
     const arena = result.arena;

     const valueMatcher = (value: Token) =>
         arena.dataTypes[value] == EnumToken.LengthTokenType && arena.numericValue[value] == 30 && arena.getUnit(value) == 'px';

     // button -> width
     const declaration = arena.getChildAt(arena.firstChild[result.ast], 1);
     const found = findValue(arena, declaration, valueMatcher);

     console.log({found}); // {node: '30px' token, parent, root, parents}
  
```

------
[← Prefix Removal](./prefix-removal.md) | [Arena Memory →](./arena.md)
