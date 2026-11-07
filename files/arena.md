---
title: Arena Memory
group: Documents
category: Guides
---

## Arena memory

The ast nodes and the value tokens are allocated in an arena ([AstArena](../docs/classes/node.AstArena.html)) and
referenced by their id (see [Ast Manipulation](./ast.md)). This page describes how the arena uses memory, when it grows
and how the memory is reclaimed.

Apart from the statement tokens recycled by the parser, the library **never frees memory by itself**: the nodes that are
detached from the tree, and the tokens allocated while minifying or rendering, stay allocated until the arena is
compacted. This keeps the node ids stable: an id obtained from
a visitor, `arena.walk()` or `arena.find()` remains valid for the lifetime of the arena. The object views returned by
`arena.toObject()` only hold the arena and the node id: they do not copy the node data.

### What the arena stores

| storage                                                       | size                                                          |
|---------------------------------------------------------------|---------------------------------------------------------------|
| node columns (typed arrays, one entry per node of capacity)   | 62 bytes per node, see the table below                        |
| interned strings (`arena.getStringCount()`)                   | one entry per distinct selector, name, identifier, string ... |
| errors (`arena.getErrors(id)`)                                | a map entry per node that has validation errors               |
| minifier caches of `AstArena`                                 | parsed / optimized selectors of the rules                     |

The columns are allocated for the **capacity** of the arena (`arena.getCapacity()`), not for the number of allocated
nodes (`arena.getLastId()`, the last allocated id):

| column                                                                                       | type              | bytes per node |
|----------------------------------------------------------------------------------------------|-------------------|---------------:|
| `dataTypes`, `colorType`                                                                     | `Uint8Array`      | 1 + 1          |
| `parents`, `nextSibling`, `previousSibling`, `firstToken`, `lastToken`, `firstChild`, `lastChild` | `Uint32Array` | 7 × 4          |
| `name`, `stringValue`, `unit`, `flags`                                                       | `Uint32Array`     | 4 × 4          |
| `numericValue`                                                                               | `Float64Array`    | 8              |
| `spans` (source location)                                                                    | `BigUint64Array`  | 8              |
| **total**                                                                                    |                   | **62**         |

```ts
import {transform} from '@tbela99/css-parser';

const result = await transform(css);
const arena = result.arena;

console.debug(arena.getCapacity());      // capacity: number of nodes the columns can hold
console.debug(arena.getLastId());        // last allocated node id
console.debug(arena.getStringCount());   // number of interned strings
console.debug(arena.getCapacity() * 62); // approximate size of the columns in bytes
```

### Capacity and growth

- the initial capacity is computed from the input length: one node for every 4 bytes of css plus 1024 nodes (at most
  2<sup>25</sup> nodes). the length of a stream is unknown: a stream starts with 4096 nodes
- parsing recycles the statement tokens that are not attached to the tree (`;`, `:`, `{`, `}`, whitespace, ...): a parse
  and a minification allocate 0.07 to 0.22 node per byte, the initial capacity is seldom exceeded
- when the capacity is exceeded, the columns are reallocated with twice the capacity and copied
- the capacity never shrinks, except when the arena is compacted

### What allocates nodes

| operation                                                 | allocated nodes                                                                 |
|-----------------------------------------------------------|---------------------------------------------------------------------------------|
| `parse()`                                                 | the nodes and the tokens of the tree. statement tokens are recycled            |
| minification                                              | the rules created when rules are merged or split, the shorthand declarations. the replaced nodes are detached, not freed |
| `render()`                                                | the tokens created by the color conversion and the gradient minification. identical colors and values are rendered once per render: a render allocates few nodes |
| `render()` with `withParents` or `expandNestingRules`     | a copy of the rendered node (and of its parents), under a temporary stylesheet node that is detached after the render |
| visitors, `arena.create*()`, `arena.clone()`              | the created nodes                                                               |
| `arena.detach()`, `arena.replaceChild()`, ...             | nothing: the detached node keeps its memory                                    |

### Reclaiming memory

| method                        | effect                                                                                                      | ids      |
|-------------------------------|-------------------------------------------------------------------------------------------------------------|----------|
| `arena.mark(...ids)`          | mark nodes to be released later (`EnumAstNodeStatus.Marked`)                                                | kept     |
| `arena.release(id?, deep?)`   | detach a node (and its descendants with `deep`) and drop its data: string references, errors, minifier caches. without argument, every marked node is released with its descendants. the column memory is not reclaimed | kept     |
| `arena.compact(errors?)`      | drop the nodes that are not reachable from the root, renumber the remaining nodes in document order, shrink the columns to the remaining nodes (plus 3% and at least 64 nodes), drop the unused strings and the minifier caches. the `node` of the errors passed as argument is remapped | **changed** |
| `arena.trim(errors?)`         | `arena.release()` (the marked nodes) followed by `arena.compact(errors)`                                    | **changed** |
| `arena.compactStrings()`      | drop the interned strings that are no longer referenced by any node. the nodes are not renumbered           | kept     |
| `arena.recycle(id)`           | reuse the id of a detached leaf node (no parent, no tokens, no children) for the next allocation. the node must no longer be referenced anywhere | reused   |

`compact()` and `trim()` return the mapping of the old ids to the new ids (`0` when the node has been dropped): the ids
stored before the call must be updated. The root stylesheet keeps the id `1`.

```ts
import {transform, EnumToken} from '@tbela99/css-parser';

const result = await transform(css);
const arena = result.arena;

// a node id stored before the compaction
let node = arena.getLastChild(result.ast);

// mark the comments of the stylesheet
for (let child = arena.getFirstChild(result.ast); child != 0; child = arena.getNextSibling(child)) {
    if (arena.getType(child) == EnumToken.CommentNodeType) {
        arena.mark(child);
    }
}

// release the marked nodes and compact the arena. the errors refer to nodes: they are remapped
const mapping = arena.trim(result.errors);

// update the ids obtained before the call
node = mapping[node]; // 0 if the node has been dropped
```

#### When to compact

- a long lived arena that is rendered many times with `withParents` or `expandNestingRules`: every render allocates a
  copy of the rendered nodes
- after removing a large part of the tree
- before sending the arena to a worker (see [Transferring an arena to a worker](./ast.md)): only the reachable nodes are
  transferred
- when the arena is kept in memory after the css has been rendered: the capacity is computed for the parse and the
  minification, the columns of the compacted arena are 2 to 8 times smaller for the stylesheets of the
  [benchmark](https://tbela99.github.io/css-parser/benchmark/index.html)

An arena that is not used anymore does not need to be compacted: drop every reference to the arena (and to the result
of `parse()` / `transform()`) and its memory is reclaimed by the garbage collector.

#### Example

tailwind.css (2.4 MB), `transform()` with the default settings, node v22:

| step                                         | `getCapacity()` | `getLastId()` | `getStringCount()` | columns |
|----------------------------------------------|----------------:|--------------:|-------------------:|--------:|
| after `transform()`                          |         621,937 |       304,289 |             35,869 | 36.8 MB |
| after 10 more `render()`                     |         621,937 |       305,319 |             35,869 | 36.8 MB |
| after a `render()` with `expandNestingRules` |         621,937 |       537,055 |             36,863 | 36.8 MB |
| after `arena.compact()`                      |         226,604 |       219,737 |             27,559 | 13.4 MB |

### Caches and compaction

- the validation results of the declaration values are cached for the string table of the arena:
  `compact()` and `compactStrings()` replace the string table when the string ids change, the cached results are not
  reused with the new ids
- the minifier caches of the rules (parsed and optimized selectors) are dropped by `compact()` and by `release()`
- the values memoized while rendering (identical declarations, colors, functions, ... are rendered once) only live for
  the duration of a `render()` call: the rendered strings are not retained. the cleared buffers of the memo are reused
  by the next renders (at most 4 memos, at most 4 MB each)

------
[← Ast Manipulation](./ast.md) | [Utility Functions →](./utilities.md)
