---
title: Ast Manipulation
group: Documents
category: Guides
---

## Arena memory layout

Ast nodes are not JavaScript objects. They are allocated in an arena ([AstArena](../docs/classes/node.AstArena.html))
and referenced by their **node id**, an integer. The node data is stored column-wise in typed arrays
(a _structure of arrays_) and is read and written with the methods of the arena: the type of the node `n` is
`arena.getType(n)`, its parent is `arena.getParent(n)`, etc. Children are stored as doubly linked lists
(`arena.getFirstChild(n)`, `arena.getLastChild(n)`, `arena.getNextSibling(n)`, `arena.getPreviousSibling(n)`) and the
strings (selectors, at-rule names, declaration names) are interned (`arena.getName(n)`, `arena.resolveString(id)`).

Every function that works with ast nodes takes the arena as its first argument and node ids instead of node objects.
Both are returned by [parse()](../docs/functions/node.parse.html) and [transform()](../docs/functions/node.transform.html).

```ts
import {parse, render, EnumToken} from '@tbela99/css-parser';

const result = await parse(`.foo { color: red }`);
const arena = result.arena;
const stylesheet = result.ast; // node id

// the first child of the stylesheet
const rule = arena.getFirstChild(stylesheet);

console.debug(arena.getType(rule) == EnumToken.RuleNodeType); // true
console.debug(arena.getName(rule)); // '.foo'
console.debug(arena.getSelector(rule)); // '.foo'

const declaration = arena.getFirstChild(rule);

console.debug(arena.getName(declaration)); // 'color'

// the value tokens are ids too
const token = arena.getFirstToken(declaration);

console.debug(arena.getType(token) == EnumToken.ColorTokenType); // true
console.debug(arena.str(token)); // 'red'
console.debug(arena.tokens(declaration)); // [token]

console.debug(render(arena, stylesheet).code); // .foo{color:red}
```

Value tokens ([Token](../docs/types/node.Token.html)) are ids allocated in the same arena: the declaration values,
the rule selector tokens and the at-rule prelude tokens are stored in the _token list_ of the node (`arena.tokens(n)`).
The parser never allocates token objects: the tokenizer output is written directly into the arena columns.

### Arena columns

Each column is read and written with a method of the arena. The memory used by the columns is described in
[Arena Memory](./arena.md).

| Column            | Read                                                     | Write                                                    | Description |
|-------------------|----------------------------------------------------------|----------------------------------------------------------|-------------|
| `dataTypes`       | `arena.getType(n)`                                       | `arena.setType(n, type)`                                 | node type ([EnumToken](../docs/enums/node.EnumToken.html)) |
| `parents`         | `arena.getParent(n)`                                     | tree operations (see below)                              | parent node id, `0` when the node is detached |
| `firstChild`      | `arena.getFirstChild(n)`, `arena.children(n)`            | tree operations                                          | first child id, `0` when empty |
| `lastChild`       | `arena.getLastChild(n)`                                  | tree operations                                          | last child id |
| `nextSibling`     | `arena.getNextSibling(n)`                                | tree operations                                          | next sibling id, `0` for the last node of the list |
| `previousSibling` | `arena.getPreviousSibling(n)`                            | tree operations                                          | previous sibling id, `0` for the first node of the list |
| `firstToken`      | `arena.getFirstToken(n)`, `arena.tokens(n)`              | `arena.setTokenList(n, tokens)`, `arena.appendToken(n, token)` | first token id of the token list (declaration values, selector / prelude tokens, function arguments), `0` when empty |
| `lastToken`       | `arena.getLastToken(n)`                                  | `arena.appendToken(n, token)`                            | last token id |
| `name`            | `arena.getName(n)`, `arena.getSelector(n)`               | `arena.setNameString(n, name)`, `arena.setSelector(n, selector)` | rule selector, at-rule name or declaration name |
| `stringValue`     | `arena.getValue(n)`, `arena.str(n)`                      | `arena.setStr(n, value)`, `arena.setValueString(n, value)` | at-rule prelude, comment or token string value (identifier, string, function name, color name, ...) |
| `numericValue`    | `arena.getNumericValue(n)`                               | `arena.setNumericValue(n, value)`                        | numeric value of number, dimension and percentage tokens. The operator of binary expressions |
| `unit`            | `arena.getUnit(n)`                                       | `arena.setUnitString(n, unit)`                           | dimension unit |
| `colorType`       | `arena.getColorType(n)`                                  | `arena.setColorType(n, type)`                            | color type of color tokens ([ColorType](../docs/enums/node.ColorType.html)), `ColorType.NONE` until the color is parsed |
| `strings`         | `arena.resolveString(id)`                                | `arena.internString(str)`                                | interned strings |
| `flags`           | `arena.getFlags(n)`, `arena.getState(n)`                 | `arena.setFlags(n, flags)`, `arena.setState(n, state)`   | validation state ([EnumAstNodeStatus](../docs/enums/node.EnumAstNodeStatus.html)) and node flags |
| `errors`          | `arena.getErrors(n)`                                     | `arena.setErrors(n, errors)`                             | validation errors |
| `spans`           | `arena.getLocation(n)`, `arena.getSource(n)`, `arena.getSpanStart(n)`, `arena.getSpanEnd(n)` | `arena.copyLocation(n, source)` | packed source location |

Tokens and nodes share the same columns: a token list is a doubly linked list (`arena.getFirstToken(n)`,
`arena.getLastToken(n)`, `arena.getNextSibling(token)`, `arena.getPreviousSibling(token)`) and the parent of a token is
the node or the token that owns the list (`arena.getParent(token)`).

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

The object view of a node, `arena.toObject(n)`, gives access to the same data by property name (see
[Object views](#object-views)).

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
- `arena.clone(n, deep?, cloneMap?)`: clone a node, its children too when `deep` is true. the clone is detached
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
arena.prependChildren(result.ast, arena.import(other.arena, other.arena.getFirstChild(other.ast)));

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
import {AstArena, EnumToken} from '@tbela99/css-parser';

self.onmessage = (event) => {

    const {ast, properties, transferables} = event.data;
    const arena = AstArena.fromTransferableArenaObjects(properties, transferables);

    // the arena is fully functional
    for (const node of arena.walk(ast)) {

        if (arena.getType(node) == EnumToken.RuleNodeType) {

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

### Object views

`arena.toObject(n)` returns an object view of a node or a token: an [AstArenaNode](../docs/classes/node.AstArenaNode.html).
The view does not copy the node: it only holds the arena (`view[ARENA]`) and the node id (`view[ARENAID]`, a keyed
symbol). Its properties are getters and setters that read and write the arena, with the names of the plain objects
(`typ`, `sel`, `nam`, `val`, `chi`, `tokens`, `unit`, `kin`, `l`, `r`, `op`, ... and `loc`, `state`, `errors`, `parent`).

```ts
import {ARENAID, EnumToken, parse, render} from '@tbela99/css-parser';
import type {AstArena} from '@tbela99/css-parser';

const result = await parse(`.foo { color: red; width: 3px }`);
const arena: AstArena = result.arena;
const rule = arena.toObject(arena.getFirstChild(result.ast));

console.debug(rule.sel); // '.foo'
console.debug(rule.chi.map((node) => node.nam)); // ['color', 'width']

const [color, width] = rule.chi;

// the setters write the arena
color.nam = 'background-color';
width.val[0].val = 4;
// the values can be node ids, views or plain objects
width.val = [{typ: EnumToken.LengthTokenType, val: 5, unit: 'px'}];

console.debug(render(arena, result.ast).code); // .foo{background-color:red;width:5px}
console.debug(color[ARENAID] == arena.getFirstChild(rule[ARENAID])); // true
```

- the nodes and the tokens (children, value tokens, fields) are returned as new views in a frozen array. the arrays,
  the locations (`loc`) and the error lists (`errors`) are frozen: modifying them throws a `TypeError` in strict mode.
  assign the property to modify the arena (`rule.chi = [...rule.chi, declaration]`),
- two views of the same node are different objects: compare their `ARENAID`,
- `arena.fromObject(object)` imports an object: importing a view of the same arena is a noop (the node id is returned,
  nothing is copied), a view of another arena is copied, a plain object tree
  ([PlainAstNode](../docs/interfaces/node.PlainAstNode.html), [PlainToken](../docs/types/node.PlainToken.html)) is
  allocated in the arena. visitors can return views, plain objects or node ids,
- `arena.toPlainObject(n)`, `view.toJSON()` and `JSON.stringify(view)` return a deep plain copy, `console.log(view)`
  prints it.

The library itself only works with node ids: the views are created on demand.

## Tokens

Tokens are ids allocated in the arena. The token type is `arena.getType(t)`, its string value (identifier, string, function name,
color name, ...) is `arena.str(t)`, its numeric value `arena.getNumericValue(t)` and its unit `arena.getUnit(t)`.

```ts
import {EnumToken, parse, renderToken, TokenField} from '@tbela99/css-parser';

const result = await parse('.foo { width: calc(1px + 2px) }', {minify: false});
const arena = result.arena;
const declaration = arena.getFirstChild(arena.getFirstChild(result.ast));
const calc = arena.getFirstToken(declaration);

console.debug(EnumToken[arena.getType(calc)]); // 'MathFunctionTokenType'
console.debug(arena.str(calc)); // 'calc'

// the function arguments are the token list of the function token
const expression = arena.getFirstToken(calc);

console.debug(arena.getType(expression) == EnumToken.BinaryExpressionTokenType); // true
console.debug(arena.getNumericValue(expression) == EnumToken.Add); // true: the operator of a binary expression
console.debug(arena.getNumericValue(arena.field(expression, TokenField.L))); // 1
console.debug(arena.getUnit(arena.field(expression, TokenField.R))); // 'px'

console.debug(renderToken(arena, calc)); // calc(1px + 2px)
console.debug(arena.toPlainObject(calc)); // {typ: EnumToken.MathFunctionTokenType, val: 'calc', chi: [{typ: EnumToken.BinaryExpressionTokenType, op: EnumToken.Add, l: {...}, r: {...}}]}
console.debug(arena.toObject(expression).l.val); // 1
```

[parseString()](../docs/functions/node.parseString.html) parses a css value into tokens allocated in the given arena:

```ts
import {AstArena, EnumToken, parseString} from '@tbela99/css-parser';

const arena = new AstArena();
const tokens = parseString(arena, 'linear-gradient(to bottom, white, black) red');

console.debug(tokens.map((t) => EnumToken[arena.getType(t)])); // ['ImageFunc', 'Whitespace', 'Color']
console.debug(arena.tokens(tokens[0]).map((t) => arena.str(t))); // ['to', '', 'bottom', '', 'white', '', 'black']
```

| Token data            | Read                                         | Write                                         |
|-----------------------|----------------------------------------------|-----------------------------------------------|
| type                  | `arena.getType(t)`                           | `arena.setType(t, EnumToken.IdenTokenType)`   |
| string value          | `arena.str(t)`, `arena.getValue(t)`          | `arena.setStr(t, 'red')`                      |
| numeric value         | `arena.getNumericValue(t)`                   | `arena.setNumericValue(t, 3)`                 |
| unit                  | `arena.getUnit(t)`                           | `arena.setUnitString(t, 'px')`                |
| color type            | `arena.getColorType(t)`                      | `arena.setColorType(t, ColorType.HEX)`        |
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

        Rule(arena: AstArena, node: AstRule): AstRule {

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

            media: (arena: AstArena, node: AstAtRule): AstAtRule => {

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
            height: (arena: AstArena, node: AstDeclaration): AstDeclaration[] => {

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

The traversal and search functions are methods of the arena. They return node ids and their callbacks (filters,
matchers) are called with the arena and the node id: the other properties of the node (parent, type, name, ...) are
read from the arena.

### arena.walk()

[arena.walk(node, filter?, reverse?)](../docs/classes/node.AstArena.html#walk) returns an iterator of the node and its
descendants, in document order.

```ts

import {EnumToken, parse} from '@tbela99/css-parser';

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
const arena = result.arena;

for (const node of arena.walk(result.ast)) {

    // the parent is 0 for the stylesheet
    console.log(EnumToken[arena.getType(node)], arena.getParent(node));
}
```

Ast traversal can be controlled using a filter function, called with the arena and the node id. The filter function
returns a value of type [WalkerOption](../docs/types/node.WalkerOption.html). The children of a node are read when the
next node is requested: the current node can be modified or detached.

```ts

import {AstArena, AstNode, EnumToken, transform, WalkerOptionEnum} from '@tbela99/css-parser';

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

function filter(arena: AstArena, node: AstNode) {

    if (arena.getType(node) == EnumToken.RuleNodeType && arena.getSelector(node).includes('html')) {

        // skip the children of the current node
        return WalkerOptionEnum.IgnoreChildren;
    }
}

const result = await transform(css);
const arena = result.arena;

for (const node of arena.walk(result.ast, filter)) {

    console.error([EnumToken[arena.getType(node)]]);
}

// [ "StyleSheetNodeType" ]
// [ "RuleNodeType" ]
// [ "DeclarationNodeType" ]
// [ "RuleNodeType" ]
// [ "RuleNodeType" ]
// [ "DeclarationNodeType" ]
```

The value tokens are visited too when the `attributes` option is set: `arena.walk(node, {attributes: true})`.

### arena.walkValues()

[arena.walkValues(tokens, filter?, reverse?)](../docs/classes/node.AstArena.html#walkvalues) traverses value tokens and
their descendants (function arguments, structured token fields, ...), allowing you to inspect or modify each token
during traversal. `tokens` is an array of token ids, or a node id: its value tokens are walked. The parent of a token is
`arena.getValueParent(token)`, the node that owns it `arena.getValueOwner(token)`.

```ts

import {EnumToken, transform} from '@tbela99/css-parser';

const css = `
body { color:    color(from var(--base-color) display-p3 r calc(g + 0.24) calc(b + 0.15)); }
`;

const result = await transform(css);
const arena = result.arena;
const declaration = arena.getFirstChild(arena.getFirstChild(result.ast));

// walk the declaration value tokens in reverse order
for (const value of arena.walkValues(declaration, null, true)) {

    console.error([EnumToken[arena.getType(value)], arena.getValue(value) || arena.getNumericValue(value)]);
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

The filter is called with the arena, the token id and the event ([WalkerEvent](../docs/enums/node.WalkerEvent.html)).
It can be restricted to some token types and to the leave event:

```ts
import {EnumToken, transform, WalkerEvent, WalkerOptionEnum} from '@tbela99/css-parser';

const result = await transform(`.foo { width: calc(1px + max(2px, 3px)) }`, {minify: false});
const arena = result.arena;
const declaration = arena.getFirstChild(arena.getFirstChild(result.ast));

for (const value of arena.walkValues(declaration, {
    event: WalkerEvent.Enter | WalkerEvent.Leave,
    type: EnumToken.MathFunctionTokenType,
    fn: (arena, token, event) => {

        console.error(arena.str(token), WalkerEvent[event]);
        // do not walk the function arguments
        return WalkerOptionEnum.IgnoreChildren;
    }
})) {

    // ...
}

// calc Enter
// calc Leave
```

### arena.find()

Searches the AST and returns the first node that matches the specified criteria.

```ts
// find the first ast declaration node which name is 'aspect-ratio'
import {EnumToken, transform} from "@tbela99/css-parser";
import type {AstArena, AstNode} from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
`;

const nodeMatcher = (arena: AstArena, node: AstNode) =>
    arena.getType(node) == EnumToken.DeclarationNodeType && arena.getName(node) == 'aspect-ratio';

const result = await transform(css);
const node = result.arena.find(result.ast, nodeMatcher);

console.log(result.arena.toObject(node)); // { typ: DeclarationNodeType, nam: 'aspect-ratio', val: [...] }
```

### arena.findByValue()

Searches the AST by traversing each node's value tokens and returns the first node with a matching value token, and the
token.

```ts
// find the first ast node which contains the length token '30px'
import {EnumToken, transform} from "@tbela99/css-parser";
import type {AstArena, Token} from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
`;

const result = await transform(css);
const arena = result.arena;

// find declaration which contains the length token '30px'
const valueMatcher = (arena: AstArena, value: Token) =>
    arena.getType(value) == EnumToken.LengthTokenType && arena.getNumericValue(value) == 30 && arena.getUnit(value) == 'px';

const {node, value} = arena.findByValue(result.ast, valueMatcher) ?? {};

console.log(arena.getName(node), arena.getValueOwner(value) == node); // width true
```

### arena.findAll()

Searches the AST and returns all nodes that match the specified criteria.

```ts
// find all ast declaration nodes which name is 'aspect-ratio'
import {EnumToken, transform} from "@tbela99/css-parser";
import type {AstArena, AstNode} from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
`;

const nodeMatcher = (arena: AstArena, node: AstNode) =>
    arena.getType(node) == EnumToken.DeclarationNodeType && arena.getName(node) == 'aspect-ratio';

const result = await transform(css);
const nodes = result.arena.findAll(result.ast, nodeMatcher);

console.log(nodes.length); // 1
```

### arena.findLast()

Search the ast tree and return the last node matching the specified criteria.

```ts
// find the last ast declaration node which name is 'aspect-ratio'
import {EnumToken, transform} from "@tbela99/css-parser";
import type {AstArena, AstNode} from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
`;

const nodeMatcher = (arena: AstArena, node: AstNode) =>
    arena.getType(node) == EnumToken.DeclarationNodeType && arena.getName(node) == 'aspect-ratio';

const result = await transform(css);
const node = result.arena.findLast(result.ast, nodeMatcher);

console.log(result.arena.getName(node)); // aspect-ratio
```

### arena.findValue()

Find the value token of a node (or a token and its descendants) that matches the specified criteria.

```ts
// find the '30px' token of the width declaration
import {EnumToken, renderToken, transform} from "@tbela99/css-parser";
import type {AstArena, Token} from "@tbela99/css-parser";

const css = `

button {
  aspect-ratio: 1;
  width: if(media(any-pointer: fine): 30px; else: 44px);
}
`;

const result = await transform(css);
const arena = result.arena;

const valueMatcher = (arena: AstArena, value: Token) =>
    arena.getType(value) == EnumToken.LengthTokenType && arena.getNumericValue(value) == 30 && arena.getUnit(value) == 'px';

// button -> width
const declaration = arena.getChildAt(arena.getFirstChild(result.ast), 1);
const token = arena.findValue(declaration, valueMatcher);

console.log(renderToken(arena, token), arena.getValueParent(token)); // 30px, the parent token id
```

### arena.expand()

`arena.expand(node)` expands the css nesting rules of a stylesheet, a rule or an at-rule in place. It is called by the
parser and the renderer when the `expandNestingRules` option is set.

```ts
import {parse, render} from "@tbela99/css-parser";

const result = await parse(`.foo { color: red; .bar & { color: blue } }`, {minify: false});

result.arena.expand(result.ast);
console.log(render(result.arena, result.ast).code); // .foo{color:red}.bar .foo{color:blue}
```

------
[← Prefix Removal](./prefix-removal.md) | [Arena Memory →](./arena.md)
