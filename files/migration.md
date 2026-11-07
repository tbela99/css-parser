---
title: Migration
group: Documents
category: Guides
---

## Migrating to 2.0

Version 2.0 stores the ast in an arena: nodes and value tokens are integer ids, their data is read and written with the
methods of the arena. This page lists every breaking change and how to update the code written for 1.x and for the
2.0 alphas.

| area | 1.x | 2.0 |
|------|-----|-----|
| [module format](#module-format) | ES module, commonjs entry point `@tbela99/css-parser/cjs` (deprecated) | ES module only |
| [ast](#ast-nodes-are-ids) | node objects (`ast.chi[0].sel`) | node ids: `arena.getSelector(arena.getFirstChild(ast))`, or object views: `arena.toObject(id).sel` |
| [parse / render](#parse-and-render) | `render(ast, options)` | `render(arena, ast, options)` |
| [object views](#object-views) | `arena.toObject(id)` returned a plain copy (2.0 alphas) | `arena.toObject(id)` returns an `AstArenaNode` view, `arena.toPlainObject(id)` the plain copy |
| [visitors](#visitors) | `handler(node, ...)` | `handler(arena, id)` |
| [traversal](#traversal-and-search) | `walk(ast)`, `walkValues(tokens)`, `find(ast, matcher)`, ... functions | `arena.walk(id)`, `arena.walkValues(tokens)`, `arena.find(id, matcher)`, ... methods returning ids |
| [callbacks](#callbacks) | filters and matchers called with the node | called with `(arena, id)` |
| [removed functions](#removed-functions) | `parseFile()`, `transformFile()`, `cloneNode()`, `cloneValue()`, `expand()`, `getNodeProperty()`, `setNodeProperty()` | `parse({file})`, `transform({file})`, `arena.clone()`, `arena.expand()`, arena methods |
| [replaceNodeOrValue()](#replacenodeorvalue) | `replaceNodeOrValue(parent, node, replacement)` | `replaceNodeOrValue(arena, node, replacement)` |
| [enums](#enums) | `ValidationLevel`, `EnumToken.Invalid*` | removed, `EnumToken` renumbered from 1 |
| [types](#types) | `WalkResult`, `WalkAttributesResult`, `TokenSearchResult`, `AstInvalid*`, ... | removed or changed |
| [memory](#memory) | garbage collected node objects | the arena keeps the detached nodes until it is compacted |

### Module format

The deprecated commonjs build (`dist/index.cjs`, export `@tbela99/css-parser/cjs`) is removed. The package is an ES
module with two entry points: `@tbela99/css-parser` (or `@tbela99/css-parser/node`) and `@tbela99/css-parser/web`. The
browser bundle `dist/index-umd-web.js` is unchanged.

In a commonjs module, load the package with a dynamic import:

```js
// before
const {transform} = require('@tbela99/css-parser/cjs');

// after
const {transform} = await import('@tbela99/css-parser');
```

Recent node versions can also `require()` an ES module.

### Ast nodes are ids

The parser does not create node objects anymore. `parse()` and `transform()` return the arena (`result.arena`) and the
id of the stylesheet node (`result.ast`, a number). The node data is read and written with the methods of the arena:

```ts
// before
const result = await parse(`.foo { color: red }`);
const rule = result.ast.chi[0];

console.log(rule.sel, rule.chi[0].nam); // .foo color

// after
const {arena, ast} = await parse(`.foo { color: red }`);
const rule = arena.getFirstChild(ast);

console.log(arena.getSelector(rule), arena.getName(arena.getFirstChild(rule))); // .foo color
```

| 1.x node property | 2.0 arena method |
|-------------------|------------------|
| `node.typ` | `arena.getType(id)`, `arena.setType(id, typ)` |
| `node.sel` | `arena.getSelector(id)`, `arena.setSelector(id, selector)` |
| `node.nam` | `arena.getName(id)`, `arena.setNameString(id, name)` |
| `node.val` (at-rule prelude, comment) | `arena.getValue(id)`, `arena.setValueString(id, value)` |
| `node.val` (declaration value tokens) | `arena.tokens(id)`, `arena.setTokens(id, ...tokens)` |
| `node.chi` | `arena.children(id)`, `arena.getFirstChild(id)`, `arena.getNextSibling(id)`, `arena.appendChildren(id, ...nodes)`, ... |
| `node.tokens` | `arena.tokens(id)` |
| `node.parent` | `arena.getParent(id)` |
| `node.loc` | `arena.getLocation(id)` |
| token `val`, `unit`, `kin` | `arena.str(id)` / `arena.getNumericValue(id)`, `arena.getUnit(id)`, `arena.getColorType(id)` |

See [Ast Manipulation](./ast.md) for the complete list. The nodes are created by the arena (`arena.createRule()`,
`arena.createDeclaration()`, `arena.createToken()`, ...) or imported from plain objects (`arena.fromObject()`).

The node type aliases (`AstRule`, `AstDeclaration`, `Token`, ...) are aliases of `number`.

### Object views

The quickest way to port code that reads and writes node objects is the object view of a node: `arena.toObject(id)`
returns an [AstArenaNode](../docs/classes/node.AstArenaNode.html) with the properties of the 1.x nodes (`typ`, `sel`,
`nam`, `val`, `chi`, `tokens`, `loc`, ...). Its properties are getters and setters that read and write the arena:

```ts
const {arena, ast} = await parse(`.foo { color: red }`);
const rule = arena.toObject(arena.getFirstChild(ast));

rule.sel = '.bar';
rule.chi[0].nam = 'background-color';

console.log(render(arena, ast).code); // .bar{background-color:red}
```

Differences with the 1.x node objects and with the plain copies returned by `toObject()` in the 2.0 alphas:

- the arrays returned by the views (`chi`, `val`, `tokens`, ...), the locations and the error lists are frozen:
  `rule.chi.push(declaration)` throws a `TypeError`. assign the property instead: `rule.chi = [...rule.chi, declaration]`,
- the values assigned can be node ids, views or plain objects. a view of the same arena is used as is (no copy), a view of
  another arena is copied,
- two views of the same node are different objects: compare their ids, `view[ARENAID]`,
- the plain copy of a node is `arena.toPlainObject(id)` (or `JSON.stringify(view)`),
- the css module variables (`result.cssModuleVariables`) are views.

### Parse and render

- `render(ast, options)` becomes `render(arena, ast, options)`. `renderToken(token, options)` becomes
  `renderToken(arena, token, options)`.
- `parseString(src)` becomes `parseString(arena, src)`: the tokens are allocated in the given arena.
- `parseDeclarations(css)` returns `{arena, nodes}`, the declarations are allocated in the arena passed as the second
  argument or in a new arena.
- the `validation` option is a boolean (the `ValidationLevel` enum is removed).
- `parseFile(file)` and `transformFile(file)` are removed: use `parse({file})` and `transform({file})`.
- `render()` renders the copies it needs (`withParents`, `expandNestingRules`) in the same arena, under a temporary
  stylesheet node that is detached after the render.

### Visitors

The visitors are called with the arena and the node id. Everything else (the parent, the root, ...) is read from the
arena:

```ts
// before
const options = {
    visitor: {
        Declaration: (node: AstDeclaration) => {
            if (node.nam == 'height') {
                node.nam = 'width';
            }
        }
    }
};

// after
const options = {
    visitor: {
        Declaration: (arena: AstArena, id: AstDeclaration) => {

            const node = arena.toObject(id);

            // everything else stays the same
            if (node.nam == 'height') {
                node.nam = 'width';
            }
        }
    }
};
```

A visitor returns:

- nothing (or `null`) to keep the node,
- an object (an object view or a plain object) or a node id to replace the node. returning the view of the node keeps
  the node,
- an array of objects and node ids to replace the node with several nodes.

The 2.0 alphas called the visitors with `(node, arena, parent, root)`: swap the first two arguments and read the parent
from the arena (`arena.getParent(id)`, `arena.getValueParent(token)` for value tokens).

### Traversal and search

The traversal and search functions are methods of the arena. They return ids and their callbacks are called with
`(arena, id)`:

| 1.x / 2.0 alphas | 2.0 |
|------------------|-----|
| `for (const {node, parent} of walk(ast))` | `for (const node of arena.walk(ast))`, `arena.getParent(node)` |
| `walk(ast, filter)`, `filter(node)` | `arena.walk(ast, filter)`, `filter(arena, node)` |
| `for (const {value, parent} of walkValues(tokens, root))` | `for (const value of arena.walkValues(tokens))`, `arena.getValueParent(value)` |
| `walkValues(tokens, root, {fn, event, type})`, `fn(value, parent, event)` | `arena.walkValues(tokens, {fn, event, type})`, `fn(arena, value, event)` |
| `find(ast, matcher)`, `findAll()`, `findLast()` | `arena.find(ast, matcher)`, `arena.findAll()`, `arena.findLast()` |
| `findByValue(ast, matcher)` returns `{node, value: {node, parent, root, parents}}` | `arena.findByValue(ast, matcher)` returns `{node, value}` (ids) |
| `findValue(node, matcher)` returns `{node, parent, root, parents}` | `arena.findValue(node, matcher)` returns the token id |

- the result objects (`{node, parent, root, arena, parents}`, `{value, parent, previousValue, nextValue, root, parents}`)
  are removed: the walks return ids. the parent of a node is `arena.getParent(id)`, the parent of a value token
  `arena.getValueParent(token)` and the node that owns a value token `arena.getValueOwner(token)`,
- `arena.walkValues()` has no `root` argument. it accepts an array of token ids or a node id (its value tokens are walked),
- the children of a node are read when the next node is requested: the current node can be modified or detached.

```ts
// before
for (const {node, parent} of walk(result.ast)) {

    console.log(EnumToken[node.typ], parent?.typ);
}

// after
const arena = result.arena;

for (const node of arena.walk(result.ast)) {

    console.log(EnumToken[arena.getType(node)], arena.getType(arena.getParent(node)));
}
```

### Callbacks

Every callback is called with the arena and the node id. The arguments that can be read from the arena are removed:

| callback | 2.0 signature |
|----------|---------------|
| visitors | `(arena, id)` |
| `arena.walk()` filter | `(arena, node)` |
| `arena.walkValues()` filter | `(arena, token, event)` |
| `arena.walkValues()` type filter | `(arena, token)` |
| `arena.find()`, `arena.findAll()`, `arena.findLast()` matchers | `(arena, node)` |
| `arena.findByValue()`, `arena.findValue()` matchers | `(arena, token)` |
| `arena.findToken()`, `arena.tokens()`, `arena.children()`, `arena.siblings()` filters | `(arena, id)` |

A callback that does not capture variables can be declared once, outside the loop that uses it.

### Removed functions

| removed | replacement |
|---------|-------------|
| `parseFile(file, options)` | `parse({file, ...options})` |
| `transformFile(file, options)` | `transform({file, ...options})` |
| `walk()`, `walkValues()`, `find()`, `findAll()`, `findLast()`, `findByValue()`, `findValue()` | the methods of the arena, see [Traversal and search](#traversal-and-search) |
| `cloneNode(node, deep)`, `cloneValue(token)` | `arena.clone(id, deep?, cloneMap?)` (tokens are always cloned deeply) |
| `expand(ast)` | `arena.expand(id)` |
| `getNodeProperty(node, key)`, `setNodeProperty(node, key, value)` | `arena.getState()`, `arena.setState()`, `arena.getErrors()`, `arena.setErrors()`, `arena.getLocation()`, `arena.setLocation()`, ... or the view properties: `arena.toObject(id).state = EnumAstNodeStatus.ValidationFailed` |
| `arena.rewind()` | `arena.mark()`, `arena.release()`, `arena.trim()`, see [Memory](#memory) |

### replaceNodeOrValue()

The `parent` argument is removed: the parent is read from the arena (`arena.getValueParent(node)`).

```ts
// before (2.0 alphas)
replaceNodeOrValue(arena, declaration, token, replacement);

// after
replaceNodeOrValue(arena, token, replacement);
```

### Enums

- `EnumToken` starts at 1: the value 0 is the type of the null node (id 0). the values of `EnumToken` are not stable
  across versions: use the names (`EnumToken.DeclarationNodeType`), not the numbers.
- removed token types:
  - `EnumToken.InvalidRuleNodeType`, `EnumToken.InvalidAtRuleNodeType` and `EnumToken.InvalidDeclarationNodeType`
    (deprecated): invalid nodes keep their type and have the `EnumAstNodeStatus.Invalid` state
    (`arena.getState(id)`),
  - `EnumToken.InvalidClassSelectorTokenType`, `EnumToken.InvalidAttrTokenType` and `EnumToken.InvalidMediaQueryTokenType`:
    they were not produced by the parser,
  - `EnumToken.InvalidCommentTokenType`: a CDO / CDC comment (`<!-- -->`) outside of the stylesheet is now a
    `EnumToken.BadCdoTokenType` token. it is reported as an error and rendered as an empty string, as before.
- `ValidationLevel` is removed: the `validation` option is a boolean.
- `WalkerEvent` and `WalkerOptionEnum` are declared with the other enums, they are still exported by the package.

### Types

- removed: `WalkResult`, `WalkAttributesResult`, `TokenSearchResult`, `AstInvalidRule`, `AstInvalidAtRule`,
  `AstInvalidDeclaration`, `InvalidClassSelectorToken`, `InvalidAttrToken`, `InvalidMediaQueryToken`
- changed: `WalkerFilter` is `(arena, node) => WalkerOption`, `WalkerValueFilter` is `(arena, token, event) => WalkerOption | Token[]`,
  `AstNodeMatcher` is `(arena, node) => boolean`, `AstValueMatcher` is `(arena, token) => boolean`, the visitor handler
  types (`GenericVisitorHandler`, ...) are `(arena, node) => result`, `ParseResult.cssModuleVariables` is a
  `Record<string, AstArenaNode>`
- added: `AstArenaNode`, `AstArenaNodeInput`, `WalkerValueOptions`, `ARENAID`, `ARENA`

### Memory

The node objects of 1.x were reclaimed by the garbage collector as soon as they were no longer referenced. The arena
keeps every node it allocated until it is compacted: the detached nodes and the tokens allocated by the minifier and the
renderer stay allocated, and their ids stay valid. The library never compacts the arena by itself:

- drop the arena (and the parse result) when it is no longer needed: its memory is reclaimed by the garbage collector,
- or reclaim the memory of a long lived arena with `arena.mark()`, `arena.release()`, `arena.compact()` and
  `arena.trim()`. `compact()` and `trim()` renumber the nodes and return the mapping of the old ids to the new ids.

See [Arena Memory](./arena.md).

------
[← Utility Functions](./utilities.md) | [Node Module →](../docs/modules/node.html)
