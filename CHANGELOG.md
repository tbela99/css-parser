# Changelog

# v2.1.0

- [x] use arraybuffer as input data

declarations:

- [x] renamed 'word-wrap' to 'overflow-wrap', 'grid-gap' to 'gap', 'grid-row-gap' to 'row-gap', 'grid-column-gap' to 'column-gap', 'font-stretch' to 'font-width'.

validation

- [x] the validation syntaxes are generated from the CSS definitions of [W3C webref](https://github.com/w3c/webref) instead of mdn-data (deprecated): `npm run syntax-update` runs `scripts/webref.ts`, `scripts/validation.ts` is removed
- [x] the units are listed in `scripts/local-patch.json`: `@webref/css` does not list them
- [x] a function or a type defined differently for different scopes keeps its definitions: the scoped definition is inlined in the syntax of its scope (`clip: rect( <top>, <right>, <bottom>, <left> ) | auto`, the `<basic-shape>` `rect()` is the shared definition)
- [x] a group is no longer matched when the value ends before its mandatory parts: `cubic-bezier(.4,0,.2)`, `[ <a> && <b> ]` with `<a>` only
- [x] the range of a numeric type is checked when it is the last token: `grid-row: 0`, `width: -10px`
- [x] `<x>#? , <y>` (`background`) leaves the last item to `<y>`, a list item must match all the tokens before the next comma, `var()` may be a part of a syntax (`var(--color) 65%` in a gradient)
- [x] the longhands that follow a shorthand that contains `var()` are not merged into it: `border: var(--b); border-color: red`
- [x] a value is invalid when the tokens are not all consumed by the syntax: `color: red blue`, `width: 10px 20px`
- [x] `:` is parsed as a colon (`ValidationTokenEnum.Colon`, matches `EnumToken.ColonTokenType`) in the validation syntaxes: `<ident-token> : <declaration-value>?`, `name: <value>`
- [x] a media feature length may be the number `0`: `@when media(width > 0)`
- [x] the `||` syntaxes are matched in the order that matches the most tokens: `transition: .2s ease-in-out transform`
- [x] the `&&` syntaxes are matched in any order, the optional syntaxes may be omitted: `[ <ident> && <length> ]` matches `thin 10px` and `10px thin`, `box-shadow: 0 0 red`
- [x] new length units: `rex`, `rcap`, `rch`, `ric`, `lvmin`, `svmax`. the unit functions (`isLengthUnit()`, `isFrequencyUnit()`, ...) are case-insensitive (`Q`, `Hz`, `kHz`)
- [x] `length2Px()` converts `in` (96px) and `pc` (16px) correctly, the units are case-insensitive
- [x] a number followed by `!important` is no longer dropped: `margin: 8px 0 0!important`
- [x] the `!important` longhands are not merged into a shorthand (the minifier threw an error): `column-gap: 16px !important; row-gap: 40px !important`
- [x] new token type `EnumToken.UniCodeRange`: `U+0025-00FF`, `U+4??` are read as a single token and rendered as they are. `u+a` is a selector in a rule prelude
- [x] `unicode-range` is validated (the validation threw an error)
- [x] the units are rendered in their canonical spelling: `20hz` is rendered `20Hz`, `2q` `2Q`, `6DB` `6dB`
- [x] the numbers with an exponent are parsed: `1.5e2!important`, `1e-3`, `1e+3`, `1.5e2px`
- [x] `<resolution>`, `<frequency>`, `<decibel>` and `<semitones>` are validated (the validation threw an error): `image-resolution`, `image-set()`, `voice-pitch`, `voice-volume`
- [x] the line endings are LF
- [x] `npm run syntax-update` prints a summary of the changes between the previous and the new syntax file (added, removed and changed declarations, types and functions, selectors, at-rules, descriptors, media features, units and languages) and appends it to `SYNTAX-CHANGES.md`, ignored by git
- [x] `npm run syntax-update` reports the removed definitions grouped by origin, with the url of the file that provided them: legacy mdn-data, mdn-data patch (csstree), `local-patch.json` or removed from webref. the origins are saved in `src/data/validation.origins.json`
- [x] the syntaxes are generated from the consolidated css definitions of `@webref/css`, pulled from a versioned url (`https://cdn.jsdelivr.net/npm/@webref/css@8.7.8/css.json`, updated manually: a new version may introduce breaking changes): the definitions of the latest level of a spec are used, the extensions and the descriptors defined by other specs are merged
- [x] the renamed properties (the legacy name aliases that are not vendor prefixed) are removed from the syntax file and reported as renamed, the parser renames them: `font-stretch` -> `font-width`, `grid-gap` -> `gap`, `grid-row-gap` -> `row-gap`, `grid-column-gap` -> `column-gap`, `word-wrap` -> `overflow-wrap`. `renamedStandardProperties` is updated manually: the report flags the renamed properties it does not contain
- [x] the at-rule descriptors defined by another spec are merged: `@font-face/size-adjust`
- [x] the value types are stored without their angle brackets (`types.color` for `<color>`)

# v2.0.1

rename file due to firefox blocking it

# v2.0.0

breaking changes

see the [migration guide](./files/migration.md)

- [x] removed the deprecated commonjs build (`dist/index.cjs`, export `@tbela99/css-parser/cjs`): the package is an ES module
- [x] `EnumToken.CommentTokenType` is 1: the value 0 is reserved for the null node, the `EnumToken` values are renumbered
- [x] the arena is never compacted nor trimmed by the library: detached nodes and the tokens allocated while rendering stay allocated. call `arena.compact()` to reclaim the memory
- [x] the initial arena capacity is computed from the input length: the arena seldom grows
- [x] `render()` renders copies (`withParents`, `expandNestingRules`) in the same arena, under a temporary stylesheet node
- [x] memory is reclaimed on demand only: `arena.mark(...nodes)` marks nodes, `arena.release()` releases the marked nodes, `arena.trim()` releases them and compacts the arena. `arena.rewind()` is removed
- [x] removed the deprecated `ValidationLevel` enum: the `validation` option is a boolean
- [x] removed the deprecated `parseFile()` and `transformFile()` functions: use `parse({file})` and `transform({file})`
- [x] removed the deprecated node types `EnumToken.InvalidRuleNodeType`, `EnumToken.InvalidAtRuleNodeType` and `EnumToken.InvalidDeclarationNodeType` (they were no longer produced: invalid nodes keep their type and get the `EnumAstNodeStatus.Invalid` state) and the deprecated `AstInvalidRule`, `AstInvalidAtRule` and `AstInvalidDeclaration` types. the `EnumToken` values that followed them are renumbered: use the `EnumToken` names, not their values
- [x] removed `EnumToken.InvalidClassSelectorTokenType`, `EnumToken.InvalidAttrTokenType` and `EnumToken.InvalidMediaQueryTokenType` (not produced by the parser) and `EnumToken.InvalidCommentTokenType`: a CDO / CDC comment outside of the stylesheet is a `EnumToken.BadCdoTokenType` token, reported and rendered as an empty string as before. the `InvalidClassSelectorToken`, `InvalidAttrToken` and `InvalidMediaQueryToken` types are removed. `EnumToken` starts at 1
- [x] the arrays returned by the object views (`chi`, `val`, `tokens`, fields), their locations (`loc`) and their error lists (`errors`) are frozen: assign the property to modify the arena
- [x] the traversal and search functions are methods of the arena: `walk()`, `walkValues()`, `find()`, `findAll()`, `findLast()`, `findByValue()` and `findValue()` are removed, use `arena.walk(node, filter?, reverse?)`, `arena.walkValues(tokens, filter?, reverse?)`, `arena.find(node, matcher)`, `arena.findAll(node, matcher)`, `arena.findLast(node, matcher)`, `arena.findByValue(node, matcher)` and `arena.findValue(node, matcher)`
- [x] `arena.walk()` and `arena.walkValues()` return node ids instead of result objects (`{node, parent, root, arena, parents}`, `{value, parent, previousValue, nextValue, root, parents}`): the parent is `arena.getParent(node)`, the parent of a value token `arena.getValueParent(token)` (the field list token of a structured token is skipped) and the node that owns it `arena.getValueOwner(token)`. `walkValues()` has no `root` argument, it accepts an array of token ids or a node id (its value tokens are walked). `findByValue()` returns `{node, value}` (ids), `findValue()` returns the token id. the `WalkResult`, `WalkAttributesResult` and `TokenSearchResult` types are removed
- [x] the callbacks are called with the arena and the node id, the arguments that can be read from the arena are removed: walk filters `(arena, node)`, walkValues filters `(arena, token, event)` and type filters `(arena, token)`, matchers `(arena, node)` / `(arena, token)`, `arena.findToken()`, `arena.tokens()`, `arena.children()` and `arena.siblings()` filters `(arena, id)`
- [x] visitors are called with the arena and the node id: `handler(arena, id)` instead of `handler(node, arena, parent, root)`. they return nothing to keep the node, or an object (an object view or a plain object) or a node id, or an array of objects and node ids, to replace it
- [x] `arena.toObject(id)` returns an object view of the node (`AstArenaNode`) instead of a plain copy: its properties (`typ`, `nam`, `sel`, `val`, `chi`, `tokens`, `unit`, `kin`, `l`, `r`, `op`, `loc`, `state`, `errors`, `parent`, ...) are getters and setters that read and write the arena, the view only holds the arena (`ARENA`) and the node id (`ARENAID`, keyed symbols). `arena.toPlainObject(id)` (and `view.toJSON()`, `JSON.stringify(view)`) returns the plain copy. `arena.fromObject()` imports views: importing a view of the same arena is a noop, the views of another arena are copied
- [x] the css module variables (`result.cssModuleVariables`) are object views of the variable nodes
- [x] removed `replaceNodeOrValue()`; use `arena.replaceToken(id, ...tokens)` for value token replacement
- [x] removed `replaceNode()`; use `arena.replaceChild(id, ...nodes)` to replace AST nodes
- [x] removed `cloneNode()` and `cloneValue()`: use `arena.clone(id, deep?, cloneMap?)`
- [x] removed `expand()`: use `arena.expand(node)`
- [x] removed `getNodeProperty()` and `setNodeProperty()`: use the arena methods (`arena.getState()`, `arena.setState()`, `arena.getErrors()`, ...) or the object view properties (`arena.toObject(id).state = ...`)
- [x] `WalkerEvent` and `WalkerOptionEnum` are declared with the other enums (they are still exported by the package)

performance

- [x] the parser recycles the tokens that are not attached to the tree (whitespace, `:`, `;`, `{`, `}`, ...): the arena allocates about half the nodes. `arena.recycle(id)` reuses the id of a detached leaf node
- [x] the initial arena capacity is one node for every 4 bytes of css
- [x] the validations of declaration values are cached per arena: a value is validated once per property syntax. the failed validations are cached too: their errors are rebuilt with the node and the location of each declaration. the cache is keyed by the string table of the arena: compacting the arena does not reuse stale results
- [x] validation allocates less: the validation context is a class, the options are not copied, `matchAllSyntaxes()` passes its result object to the matching functions
- [x] the syntax definitions are tokenized by character code (no per character strings, regular expressions or position copies)
- [x] tokenizer: symbols, units and function names are looked up in hash tables by source range (no string per lookup), the characters are read by code (no single character strings), numbers are parsed without a string when the result is exact, the whitespace text is not kept
- [x] `arena.walk()` and `arena.walkValues()` return iterator objects instead of generators: one small object per walk, the iteration result object is reused, no closure, no result object or array per visited node. the children are read when the next node is requested. the iteration protocol (`next()`, `return()`, `for ... of`) is unchanged
- [x] parser: the declaration colors are parsed without an iterator, the selector string is built without intermediate arrays, maps or closures, `toLowerCase()` is not called on lowercase strings
- [x] renderer: `renderValue()` creates no options / cache object and no closure per call, token lists are rendered from the linked lists, `render()` copies the options with a fast clone and does not flatten the rendered children to remove the last semicolon
- [x] renderer: identical declarations (same name and value tokens) are rendered once per render: `.s{width:10px} .g{width:10px}` renders `width:10px` once. colors and constructs (functions, parentheses, binary expressions, ...) are memoized too, the individual tokens are not (`convertColor()` is called once per distinct color, fewer tokens are allocated while rendering). the source map locations are still computed for every node
- [x] renderer: numbers are minified once, the last semicolon of a block is known from the type of the last child (the rendered child is not read)
- [x] renderer: the memo keys are serialized compactly (most tokens take 1 or 2 values) directly in the key pool, the memos are reused by the next renders
- [x] minifier: the rule / at-rule preludes are not parsed again after the selectors are rewritten (at-rules used to get their name parsed as prelude tokens), the default values of the shorthand properties are parsed once
- [x] minifier: the rule sizes are compared with a renderer that resolves the options once and shares the rendered values, tokens are compared and deduplicated by structure instead of signature strings
- [x] parser: small inputs of known length do not allocate 4096 nodes
- [x] the single line methods (arena accessors and setters, tokenizer, line map and source file accessors, validation context, memo lookups) are inlined at their call sites inside the library. each inlined line is preceded by a `// inlined: <call>` comment. the public methods are unchanged

features

- [x] `AstArenaNode`: lightweight object view of an arena node, see `arena.toObject()`
- [x] `arena.getValueParent(token)`, `arena.getValueOwner(token)`, `arena.toPlainObject(id)`
- [x] arena accessors: `arena.getNextSibling(id)`, `arena.getPreviousSibling(id)`, `arena.getFirstToken(id)`, `arena.getLastToken(id)`, `arena.getCapacity()`, `arena.getLastId()` and `arena.getStringCount()`

documentation

- [x] [Arena Memory](./files/arena.md): memory used by the arena, capacity and growth, what allocates nodes, reclaiming memory with `mark()`, `release()`, `compact()`, `trim()`
- [x] the traversal, the visitors and the object views are documented with the new signatures ([Ast Manipulation](./files/ast.md), [Custom Transform](./files/transform.md), [Validation](./files/validation.md), [Plugins](./files/plugins.md), [Utility Functions](./files/utilities.md))
- [x] [Migration](./files/migration.md): the breaking changes of 2.0 and how to update the code
- [x] the documentation, the README and the examples read and write the arena with its methods (`arena.getType(n)`, `arena.getName(n)`, `arena.getFirstChild(n)`, `arena.setType(n, type)`, ...) instead of accessing the columns

# 1.8.2

remove left over console debug

# 1.8.1

no code change

# 1.8.0

- [x] the walker functions now use DFS instead of BFS
- [x] [disallow](https://drafts.csswg.org/css-mixins-1/#mixin-rule) mixin inside rules or nested groups 
- [x] [disallow](https://drafts.csswg.org/css-mixins-1/#mixin-rule) layer inside mixin
- [x] [disallow](https://drafts.csswg.org/css-mixins-1/#contents-rule) contents outside mixin
- [x] support dashed indent as unit

```css
.module {
  margin-block: 1.5--bs;
  border-block: .5--bs;
  /* gives a vertical margin of 12px,
     and vertical border of 4px */
}
```

is rendered as 

```css
.module {
 margin-block: 1.5--bs;
 border-block: .5--bs
}
```

# v1.7.0

- [x] implement CSS [Custom Functions and Mixins Modules and Level 1](https://drafts.csswg.org/css-mixins/#apply-rule)  
- [x] allow \<or\> [outside parenthesis](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using#testing_for_multiple_features_with_or)

```ts
@media ((color) and (hover)) or (monochrome) {
  /* … */
}
```

# v1.6.9

fix import path #166 from package.json

# v1.6.8

- [x] allow a visitor to visit all nodes

```ts
import {transformSync} from '@tbela99/css-parser';

 const options = {
            input: `
    
    button {
            	line-height: 2.5 !important;
            	line-height: 1.5;
            }
    `,
            beautify: true,
// visit all nodes
  visitor (node) {
      
    console.error(EnumToken[node.typ]);
  }
        };

  const result = transformSync(options);
  console.debug(result.code);
```

- [x] implement CSS [at-rule function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@function) support

# v1.6.7

## Improvement

- [x] limit the amount of memory used when parsing large files
- [x] use node flags as bitmasks
- [x] merging properties now takes into consideration the !important flag

```ts
import {transformSync} from '@tbela99/css-parser';

 const options = {
            input: `
    
    button {
            	line-height: 2.5 !important;
            	line-height: 1.5;
            }
    `,
            beautify: true,
        };

  const result = transformSync(options);
  console.debug(result.code);
```

result

```css
button {
 line-height: 2.5!important
}
```

## Fixes

- [x] fix powerless and missing components handling with color-mix(). missing and powerless colors are now [carried forward](https://drafts.csswg.org/css-color-5/#rcs-intro)

```ts
const css = `

    button {
    
color: color-mix(in hsl, hwb(none none none), hsl(11 33 44));
color: color-mix(in hsl, lch(none none 180), hsl(11 33 44));
color: color-mix(in srgb, white, black);
color: color-mix(in oklch, oklch(0.783 0.108 326.5 / 0.5), oklch(0.392 0.4 0 / none));

    color: color-mix(in srgb, color(display-p3 none none none), color(srgb 0.11 0.33 0.44));
color: color-mix(in oklch, oklch(78.3% 0.108 326.5), oklch(39.2% 0.4 none)) ;

}
`;

const result =  transformSync({input: css, 
  beautify: true, 
  inlineCssVariables: true,
  removeDuplicateDeclarations: false,
  convertColor: ColorType.SRGB
});

console.debug(result.code);
```

result

```css
button {
 color: color(srgb .78255 .272052 .15745);
 color: color(srgb .5852 .32384 .2948);
 color: color(srgb .5 .5 .5);
 color: color(srgb .843871 -.026576 .636173/50%);
 color: color(srgb .11 .33 .44);
 color: color(srgb .764947 .131643 .788822)
}
```

# v1.6.6

## Fixes

- [x] parsing aspect ratio using a single number
- [x] bugs in calc()
- [x] computing media range in container at-rule  

```css
 
    @media (aspect-ratio: 1.77) {
  html {
    background-color: cyan;
  }
}

body {
  left: sin(45deg);
  left: cos(45deg);
  left: tan(45deg);
  left: asin(0.5);
  left: acos(0.5);
  left: atan(10);
  left: atan2(-1, 1);
}

p {
  font-size: calc(pow(10, 12) * 1rem);
  font-size: calc(sqrt(100) * 1rem);
  font-size: calc(hypot(3, 4) * 1rem);
  font-size: calc(log(10) * 1rem);
  font-size: calc(exp(10) * 1rem);
}


p {
  color: alpha(from red / calc(alpha * 0.5));
}
p {
  font-size: calc(pow(e, pi) * 1rem);
}

@container (min-width: 700px) {
  .container {

display: grid;
  }
}
    
@container (max-width: 1400px) {
  .container {

display: grid;
  }
}
    
@container (min-width: 700px) and  (max-width: 1400px) {
  .container {

display: grid;
    /* styles applied when a container is at least 700px */
  }
}

```
is now computed as 

```css
@media (aspect-ratio:1.77) {
 html {
  background-color: cyan
 }
}
body {
 left: .707107;
 left: .707107;
 left: 1;
 left: 30deg;
 left: 60deg;
 left: .234turn;
 left: -45deg
}
p {
 font-size: 23.140693rem;
 color: #ff000080
}
@container (width>=700px) {
 .container {
  display: grid
 }
}
@container (width<=1400px) {
 .container {
  display: grid
 }
}
@container (700px<=width<=1400px) {
 .container {
  display: grid
 }
}
```

# v1.6.5

## New

- [x] Added fine-grained minification parameters:
  - [x] RenderOptions#minifyValues: minify CSS values such as numbers and dimension tokens
  - [x] ParseOptions#minifyAST: minify the AST.

## Improvement

```css
  .footer{
     grid-row:4;
     grid-column:1;
     grid-column-end:2;
  }
```

is now computed as 

```css
.footer {
 grid-area: 4/1/auto/2
}
```

## Fixes

- [x] fix a98-rgb, hwb color color space handling in color-mix()
- [x] fix percentage handling in relative rgb color

```css
 .c {
color: rgb(from rgb(20% 40%  60% / 80%) r g b / calc(alpha / 2));
```
is now computed as 

```css
.c {
 color: #3696
}
```

# v1.6.4

## New

Compute shorthand properties:
- grid-area
- grid-row
- grid-column

## Improvement

faster tokenizer and node walker functions.

# v1.6.3

## Fix
- [x] fix infinity rendering as 1/0 instead of 0/0 (NaN)

```css

    @media (min-width: 300px) and (max-width: 768px){
    .s {
  
    margin-left: calc(infinity + 1 + calc(infinity - 1 + calc(infinity / 1 + calc(infinity * 1))));
    margin-right: calc(infinity + 1px + calc(infinity - 1 + calc(infinity / 1 + calc(infinity * 1))));

}

```
is parsed as 

```css
@media (300px<=width<=768px) {
 .s {
  margin-left: calc(1/0);
  margin-right: calc(1/0 + 1px)
 }
}
```

# v1.6.2

## Fix
- [x] fix base64 encoding error when inline sourcemap is enabled

## Improvements
- [x] handle division by zero in calc()
- [x] strip escaped new line from string
- [x] range media query : parse more expression as range query
- [x] handle NaN and Infinity in computation
- [x] parse \<url-modifiers\>

strip escaped new line from string
```css
a[title="a not s\
o very long title"] {
  
color: blue;
```

is escaped as 

```css
a[title="a not so very long title"] {
 color: blue
}
```
parsing range query is improved

```css

@media (min-resolution: 2dppx) {}
```
is parsed as 

```css
@media (resolution>=2x) {}
```

NaN and Infinity are now handled in calc().

```css

    @media (min-width: 300px) and (max-width: 768px){
    .s {
  
    top: calc(NaN * 1px);
    line-height: calc(NaN * 1);
  color: alpha(from red/calc(0/0));
  background: alpha(from red/calc(pi/0));
    height: calc(1px * (NaN + 1));  
    width: calc(NaN + 1 + calc(NaN - 1 + calc(NaN / 1 + calc(NaN * 1))));
    margin-left: calc(infinity + 1 + calc(infinity - 1 + calc(infinity / 1 + calc(infinity * 1))));
    margin-right: calc(infinity + 1px + calc(infinity - 1 + calc(infinity / 1 + calc(infinity * 1))));

}

```
is parsed as 

```css
@media (300px<=width<=768px) {
 .s {
  top: calc(NaN*1px);
  line-height: calc(NaN);
  color: alpha(from red/calc(NaN));
  background: alpha(from red/calc(1/0));
  height: calc(1px*NaN);
  width: calc(NaN);
  margin-left: calc(0/0);
  margin-right: calc(0/0 + 1px)
 }
}
```
Parsing url() \<url-modifiers\> is supported.

```css

    .s {
    background: url("star.gif" crossorigin(anonymous));
}
```
is parsed as 

```css
.s {
 background: url(star.gif crossorigin(anonymous))
}
```

# v1.6.1

## Fixes
- [x] fix bugs when computing math functions.
- [x] reduce array mutations
- [x] supporting additional shorthands: scroll-timeline, scroll-padding, scroll-margin.
- [x] do not minify transform function when the absolute angle is greater or equals to 360deg

```css

  a:hover {

transform: rotate(calc(2.5*pi * 1rad))  }
  .now {
    transform: translate(100px, 100px) rotate(1215deg) skewX(10deg);
}
```
should be minified to
```css
a:hover {
 transform: rotate(450deg)
}
.now {
 transform: translate(100px,100px)rotate(1215deg)skew(10deg)
}
```

# v1.6.0

## Improvements
- [x] added support for math function `tan()`.
- [x] faster tokenizer
- [x] ensure transform: rotate(360deg) is not minified to transform: none
- [x] support input sourcemap from inline sourcemap file. This is only supported by the async parser.

```css

table.colortable {
 width: 100%;
 text-shadow: none;
 border-collapse: collapse
}
table.colortable td {
 text-align: center
}
table.colortable td.c {
 text-transform: uppercase;
 background: #ff0
}
table.colortable th {
 text-align: center;
 color: green;
 font-weight: 400;
 padding: 2px 3px
}

/*# sourceMappingURL=sourcemap.css.map */
```

# v1.5.0

## Improvements

- [x] Add support for input sourcemap

# v1.4.11

- fix bug in url resolution

# v1.4.10

- failure to convert colors to display-p3-linear due to missing import

# v1.4.9

## Improvements

### Provide sync Api
- [x] Added parseSync() and transformSync() with the limitations below: 

  Unsupported parse features
    - [x] flattened at-rule import files
    - [x] using file loader as options.load() is forbidden
    - [x] parse from stream
    - [x] parse file as input parameter
  
  Unsupported CSS modules features
    - [x] pattern cannot use sha1, sha256 or sha512 algorithms
    - [x] composes classes from file will throw an error
    - [x] import css at-rule value from file will throw an error

### Sourcemap
- [x] Embed CSS content into the sourcemap when the src file is not provided

### Performance
- [x] Implement lazy token offsets calculation
- [x] Remove unnecessary values rounding

## v1.4.8

### Improvements

- [x] Support display-p3-linear color space. 

## v1.4.7

### Improvements

- [x] Added support for parsing wrapped function arguments as defined in the CSS Values & Units Level 5 specification for component functions. 

  ```css
  font-family: random-item(--x,{Times,serif},{Arial,sans-serif},{Courier,monospace})
  ```
### Fixes

- [x] Fixed a performance regression, resulting in approximately ***25%*** performance gain.
- [x] Fixed a `conic-gradient()` minification bug.
- [x] Fixed missing characters by the streaming tokenizer
- [x] `walk()` with reverse parameter enabled was reversing the node's children
- [x] merging nodes could introduce a null reference
  
## v1.4.6

- [x] Fix if() syntax expansion regression bug #134

## v1.4.5

- [x] Temporarily disable if() syntax expansion #131

## v1.4.4

### Validation changes

- [x] Added the `state` and `errors` properties to nodes to expose their validation status and any associated validation errors. #127
- [x] Nodes that fail validation are no longer discarded. Nodes are discarded only if they are invalid, unparsed, or malformed. Unknown nodes are discarded when lenient parsing is disabled.

### Color

- [x] `alpha()`: Added support for minifying the CSS Color 5 `alpha()` color function.

```ts

import {transform} from '@tbela99/css-parser';

const css = `

:root {
--mycolor:  oklch(60% 0.25 315 / 0.8);
}
    .s {
    
    color:
 alpha(from var(--mycolor)  / calc(alpha * 0.5));

`;

const result = await transform(css, {
                    beautify: true,
                    inlineCssVariables: true,
                });

console.debug(result.code);

```

result:

```css
.s {
 color: #b538e366
}
```

- [x] `color-mix()`: Implemented support for the updated `color-mix()` syntax defined in https://www.w3.org/TR/css-values-5/#color-mix


```ts

import {transform} from '@tbela99/css-parser';

const css = `
.hsl { color: color-mix(firebrick, goldenrod); }
`;

const result = await transform(css, {
                    beautify: true,
                    convertColor: ColorType.OKLAB
                });

console.debug(result.code);

```

result:

```css
.hsl {
 color: oklab(.624172 .087878 .113592)
}
```

### Webkit gradient prefix removal

- [x] Convert -webkit-* gradient functions
  - [x] -webkit-gradient() to:
    - [x] linear-gradient()
    - [ ] radial-gradient() - not supported ⚠️
  - [x] -webkit-linear-gradient()
  - [x] -webkit-repeating-linear-gradient()
  - [x] -webkit-radial-gradient()
  - [x] -webkit-repeating-radial-gradient()  
  
### CSS gradient minification

- [x] Minify gradient functions
  - [x] linear-gradient()
  - [x] radial-gradient()
  - [x] conic-gradient()
  - [x] repeating-linear-gradient()
  - [x] repeating-radial-gradient()
  - [x] repeating-conic-gradient()

### Other changes

- [x] Minify transform-origin property
- [x] Changing oklab distance threshold to `0.00001` according to https://drafts.csswg.org/css-color-4/#comparing-color-values
  
### Bug fixes
- [x] Fix path resolution on Windows
- [x] Do not minify supports() arguments
  
CSS incorrectly parsed:

```css
body {
  background-color: if(
    supports(color: oklch(0.7 0.185 232)): oklch(0.7 0.185 232);
    else: #00adf3;
  );
  
  &::after {
    content: if(
    supports(color: oklch(0.7 0.185 232)): "Your browser supports OKLCH";
    else: "Your browser does not support OKLCH";
    );
  }
}
```

result:

```css
body {
 background-color: if(supports(color:#00aefc):#00aefc;else:#00adf3);
 &:after {
  content: if(supports(color:#00aefc):"Your browser supports OKLCH";else:"Your browser does not support OKLCH")
 }
}
```

instead of:

```css
body {
 background-color: #00adf3;
 @supports (color:oklch(.7 .185 232)) {
  background-color: #00aefc
 }
 &:after {
  content: "Your browser does not support OKLCH";
  @supports (color:oklch(.7 .185 232)) {
   content: "Your browser supports OKLCH"
  }
 }
}
```

- [x] Incorrectly parse selector when removePrefix and css module settings are enabled

```css
*,:before,:after {
 box-sizing: border-box
}
```
is parsed and rendered as:

```css
,,*:before:after {
 box-sizing: border-box
}
```

instead of:

```css
*,:before,:after {
 box-sizing: border-box
}
```

### Deprecation

#### Loading as commonjs module
- [x] Deprecate commonjs entry point. It will be removed in a future release.

#### Functions
- [x] Deprecate `parseFile()`. Use `parse({file, asStream, ...options})` instead.
- [x] Deprecate `transformFile()`. Use `transform({file, asStream, ...options})` instead

#### Enums
- [x] Deprecate using `ValidationLevel` to configure parsing validation settings. Use `boolean` values instead.
- [x] Deprecate invalid `EnumToken` node types. There are no longer used.
- [x] `EnumToken.InvalidRuleNodeType`
- [x] `EnumToken.InvalidAtRuleNodeType`
- [x] `EnumToken.InvalidDeclarationNodeType`

#### Interfaces
- [x] `AstInvalidRule`
- [x] `AstInvalidDeclaration`
- [x] `AstInvalidAtRule`

## v1.4.3

### CSS Modules

- [x] Add css module scope 'shortest' to produce short scoped names

```typescript

result = await transform(css, {

    beautify: true,
    module: {scoped: ModuleScopeEnumOptions.Shortest
    }
});

console.log(result.code);
```

output

```css
.a {
    background: red;
    color: #ff0
}
.b {
    background: blue
}
```

### CSS if() function

- [x] support if() css function syntax https://drafts.csswg.org/css-values-5/#if-notation
- [x] convert css if() function into legacy syntax

```typescript

const css = `
button {
	background: linear-gradient(
		if(media(min-width: 768px): to right; else: to bottom),
		if(style(--dark-mode): #333; else: #fff),
		if(style(--dark-mode): #000; else: #ccc)
	);
}`;

result = await transform(css, {

    beautify: true,
    expandIfSyntax: true
    }

});

console.log(result.code);
```

output

```css
button {
 background: linear-gradient(to bottom,#fff,#ccc);
 @media (min-width:768px) {
  background: linear-gradient(to right,#fff,#ccc);
  @container style(--dark-mode) {
   background: linear-gradient(to right,#333,#000)
  }
 }
 @container style(--dark-mode) {
  background: linear-gradient(to bottom,#333,#000)
 }
}
```


### CSS Color Module Level 5 (Draft)
- [x] support contrast-color() https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/contrast-color
- [x] custom color space in color() https://drafts.csswg.org/css-color-5/#custom-color
    - [x] relative color syntax
    - [x] color syntax

### Media Queries
- [x] media queries validation
- [x] automatically generate range media query
- [x] add at-rule() and named-feature() to @support-condition syntax https://drafts.csswg.org/css-conditional-5/#changes-from-L4
- [x] support calc() in media features


```typescript

const css = `

@media (width >= calc(1024px + 50px)) {
  h1 {
    color: Highlight;
  }
}`;

result = await transform(css, {

    beautify: true,
    validation: true
    }

});

console.log(result.code);
```

output

```css
@media (width>=1074px) {
 h1 {
  color: Highlight
 }
}
```

### Ast

- [x] add ast search functions
  - [x] find() search the ast tree and return the first match
  - [x] findAll() search the ast tree and return all matches
  - [x] findLast() search the ast tree and return the last match
  - [x] findByValue() search the ast tree by checking each node's value and return the first match

### Other Changes
- [x] fix parsing bugs
- [x] automatically rename standard declaration names : color-adjust => print-color-adjust
- [x] rewrite parsing and validation logic
    - [x] selector
    - [x] declaration
    - [x] at-rules
        - [x] @charset
        - [x] @color-profile
        - [x] @container
        - [x] @counter-style
        - [x] @custom-media
        - [x] @document
        - [x] @font-face
        - [x] @font-feature-values
        - [x] @font-palette-values
        - [x] @import
        - [x] @keyframes
        - [x] @layer
        - [x] @media 
        - [x] @namespace
        - [x] @page
        - [x] @position-try
        - [x] @property
        - [x] @scope
        - [x] @starting-style
        - [x] @supports
        - [x] @view-transition
- [x] introduce rawToken type to capture unparseable tokens

## v1.4.2

- [x] add css-conditional-5 @support at-rule(<at-keyword-token>) function
- [x] fix bug when using remove prefix #120

## v1.4.0

### CSS Module support

- [x] scoped name generation
- [x] composes:
  - [x] compose from local selector
  - [x] compose from other files
  - [x] compose from global selector
  - [x] comma separated compose list
- [x] :local
- [x] :global
- [x] :local()
- [x] :global()
- [x] selector
- [x] dashed ident (custom properties)
- [x] css at-rule property
- [x] css at-rule value
- [x] keyframe animations
- [x] grid
- [x] naming
  - [x] ignore
  - [x] camelCase
  - [x] camelCaseOnly
  - [x] dashCase
  - [x] dashCaseOnly
- [x] default mode
  - [x] global
  - [x] local
  - [x] pure(at least one class or id)
  - [x] icss
    - [x] :import
    - [x] :export

### Bug Fixes
- [x] fix \<integer\> syntax validation #115

## v1.3.4

- [x] make streaming optional #109
- [x] patch at-rule syntax for @font-feature-value #110
- [x] support percentage in transform() and scale() #111
- [x] allow arrays in visitor definition #112

## v1.3.3

- [x] relative color computation bug #105
- [x] allow duplicated declarations of whitelisted properties #106

## v1.3.2

- [x] add missing return type

## v1.3.1

- [x] generate documentation
- [x] parse input from readable stream
- [x] add parseFile() and transformFile()
- 
## v1.3.0

- [x] numerical and dimension tokens use numbers instead of string
- [x] fix bug when inlineCssVariables is disabled and computeCalcExpression is enabled

## V1.2.0

- [x] convert color to any supported color space #94
- [x] dead code removal #93
- [x] validation syntax update #92

## v1.1.1

- [x] fix bug when css nesting is disabled #89
- [x] validation rules update #87

## v1.1.0

- [x] inline sourcemap
- [x] CSS validation using mdn-data
- [x] prefix removal now remove prefixes from all nodes. prefixed linear gradients are not supported

# v1.0.0

- [x] current color parse error when used in color functions
- [x] minification : CSS transform module level 2
  - [x] translate
  - [x] scale
  - [x] rotate
  - [x] skew
  - [x] perspective                                  
  - [x] matrix
  - [x] matrix3d
- [x] keyframes
    - [x] remove consecutive keyframes with the same name
    - [x] reduce keyframe selector 'from' to '0%'
    - [x] reduce keyframe selector '100%' to 'to'
    - [x] remove keyframe selector ignored declarations
    - [x] merge keyframe rules and declarations
- [x] trim extra space in declaration value 'url() 15%' -> 'url()15%', '1% !important' -> '1%!important'
- [x] allow empty value for css variable declaration '--color: ;'
- [x] change generate nesting rule default to true

# v0.9.1

- [x] minification passes #66
- [x] nesting selector cannot match pseudo element #67

# v0.9.0

validation
- [x] validate invalid pseudo classes
- [x] rewrite selector validation
- [x] lenient mode that preserves 
  - [x] unknown at-rules
  - [x] unknown declarations 
  - [x] unknown pseudo classes

media query level 5
- [x] at-rule custom-media
- [x] at-rule when-else custom media
- [x] at-rule charset validation
- [x] media query error handling
- [x] at-rule container
- [ ] expand at-rule custom-media
- [ ] expand at-rule when-else

selector validation
- [ ] pseudo class arguments validation
- [ ] pseudo class validation

declaration validation
- [ ] validate declaration

error validation
- [ ] when a parent is marked as invalid node, do not parse or validate descendant nodes

# v0.8.0

- [x] validate selectors using mdn data
- [x] at-rules prefix removal
- [x] at rules validation
    - [x] at-rule prelude
    - [x] at-rule body
    - [x] keyframe validation
    - [ ] :not() does not accept pseudo classes
    - [ ] do not validate declarations in @supports
- [ ] declarations validation
- [x] evaluate math functions: calc(), clamp(), min(), max(), round(), mod(), rem(), sin(), cos(), tan(), asin(),
  acos(), atan(), atan2(), pow(), sqrt(), hypot(), log(), exp(), abs(), sign() #49
- [x] incorrectly parse compound selector #51

# v0.7.1

- [x] fix nesting rules expansion #45

# v0.7.0

- [x] fix merging rules
- [ ] experimental CSS prefix removal
    - [x] declaration name
    - [ ] declaration value
    - [ ] exclude -webkit-* gradients
- [x] css selector validation
    - [x] pseudo element
    - [x] partial pseudo class validation. does not validate parameters
    - [x] attribute selector
    - [x] combinator
    - [x] simple selector
    - [x] nested selector
    - [x] strict vs permissive validation: allow unknown items such as pseudo classes
        - [x] allow unknown pseudo classes
        - [x] allow unknown attribute selectors
- [x] strip universal selector when possible

# v0.6.0

- [x] light-dark() color
- [x] system color

## V0.5.4

- [x] incorrectly expand css nesting rules

## v0.5.3

- [x] incorrectly expand css nesting rules

## v0.5.1

- [x] failed to flatten @import when using url() syntax

## v0.5.0

- [x] render node with parents
- [x] fix relative color from xyz
- [x] fix bug when inlineCss is true but no css variable exists
- [x] compute more shorthands
- [x] (web) fetch imported css files from external domains using cors

## v0.4.1

no code change

## v0.4.0

Parsing

- [x] allow async node visitors
- [x] adding declaration parsing helper async parseDeclarations(source: string): Promise<AstDeclarations[]>

CSS color level 4 & 5

- [x] color space: srgb, srgb-linear, display-p3, prophoto-rgb, a98-rgb, rec2020, xyz, xyz-d50
- [x] color-mix()
- [x] color()
- [x] relative color
- [x] lab()
- [x] lch()
- [x] oklab()
- [x] oklch()

## v0.3.0

### shorthands

- [x] column-rule
- [x] columns
- [x] container
- [x] flex
- [x] flex-flow
- [x] gap

### Other

- [x] renamed RenderOptions.colorConvert to RenderOptions.convertColor
- [x] support none keyword in color
- [x] css relative color syntax for rgb(), hsl() and hwb() colors https://www.w3.org/TR/css-color-5/#relative-colors
    - [x] rgb
    - [x] hex
    - [x] hsl
    - [x] hwb
    - [x] calc()
    - [x] calc() and inline var()

## v0.2.0

- [x] cancellable parser promise using abortSignal
- [x] node visitor (callback) :
    - [x] Declaration visitor
    - [x] selector visitor
    - [x] at-rule visitor
- [x] support mixing units with calc()

### shorthands

- [x] transition
- [x] list-style
- [x] text-emphasis
- [x] animation

### Minification

- [x] parsing column combinator
- [x] css selector level 4 attribute modifiers
- [x] selector-4 parsing https://www.w3.org/TR/selectors-4/

## v0.1.0

- [x] sourcemap generation
- [x] reduce calc():
- [x] inline css variables
- [x] configure duplicate declarations removal
- [x] configure shorthand properties computation

## v0.0.1

### Minification

- [x] merge identical rules
- [x] merge adjacent rules
- [x] minify colors
- [x] minify numbers and Dimensions tokens
- [x] compute shorthand: see the list below
- [x] remove redundant declarations
- [x] simple shorthand properties (padding, margin, etc). must have all required properties
- [x] complex shorthand properties (background, font, etc.). may have optional properties
- [x] conditionally unwrap :is()
- [x] automatic css nesting
- [x] automatically wrap selectors using :is()
- [x] multi-level shorthand properties (
  border - [border-width, border-color, border-style, etc.]) https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties
- [x] avoid reparsing (declarations, selectors, at-rule)
- [x] node and browser versions
- [x] decode and replace utf-8 escape sequence

### Computed shorthands

- [x] background
- [x] border
- [x] border-bottom
- [x] border-color
- [x] border-left
- [x] border-radius
- [x] border-right
- [x] border-style
- [x] border-top
- [x] border-width
- [x] font
- [x] inset
- [x] margin
- [x] outline
- [x] overflow
- [x] padding
- [x] text-decoration

### Performance

- [x] flatten @import

### Error handling

- [x] parse bad comments / cdo comments
- [x] parse bad string 1
- [x] parse bad string 2
- [x] parse empty declaration
- [x] parse unclosed rule
- [x] parse unclosed at-rule
- [x] parse bad import

# Testing

- [x] node tests
- [x] browser tests

# Code Coverage

- [x] node
- [x] browser
