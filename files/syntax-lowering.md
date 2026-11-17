---
title: Syntax Lowering
group: Documents
category: Guides
---

New CSS syntax is lowered to legacy syntax.


## CSS if() syntax

Expand CSS if() syntax into legacy syntax.

```ts
import {transform} from '@tbela99/css-parser';

const css = `
button {
	background: linear-gradient(
		if(media(min-width: 768px): to right; else: to bottom),
		if(style(--dark-mode): #333; else: #fff),
		if(style(--dark-mode): #000; else: #ccc)
	);
}
`;

const result = await transform(css, {
    beautify: true,
    expandIfSyntax: true
}); 

console.debug(rendered.code);
````

result:

```css
button {
 background: linear-gradient(#fff,#ccc);
 @media (min-width:768px) {
  background: linear-gradient(90deg,#fff,#ccc);
  @container style(--dark-mode) {
   background: linear-gradient(90deg,#333,#000)
  }
 }
 @container style(--dark-mode) {
  background: linear-gradient(#333,#000)
 }
}
````

## CSS mixins (experimental)

Evaluate [CSS mixins](https://drafts.csswg.org/css-mixins-1/#mixin-rule): the `@apply` rules are replaced by the body of the mixin they reference.
This feature is disabled by default. It is enabled using `{evaluateMixins: true}`.

A value that is not valid (a variable that is not defined and has no fallback, a dependency cycle) is left as is.
A mixin that is not valid (its parameters are not unique, ...) is ignored: it is left as is, the `@apply` rules that reference it are not evaluated, the mixins it references are kept.

An `@apply` rule is evaluated when:
- the mixin is defined only once. A mixin can be defined at the top level of the stylesheet, in a cascade layer (`@layer`), or in a conditional group rule (`@media`, `@supports`, `@container`, `@when`, `@else`). A mixin defined in a conditional group rule is not evaluated
- the arguments match the mixin parameters: there are no extra arguments, every parameter without a default value has an argument, and the arguments and the default values match the parameter type (`--color <color>`, `--size type(<length> | auto)`). An argument that references a variable (`var()`, `env()`, ...) is not checked
- the mixin does not apply itself, directly or through other mixins

Otherwise, the `@apply` rule is left as is. 

The evaluated mixins and the mixins that are not referenced are dropped and replaced with a comment. They are kept using `{keepMixins: true}`.
The mixins referenced by an `@apply` rule that is not evaluated are kept, they are reduced to their last definition in the same scope.

```ts
import {transform} from '@tbela99/css-parser';

const css = `
@mixin --shadowed-values(--color2: green, --color3: green) {
  @private { --color3: blue; }
  background: linear-gradient(var(--color1), var(--color2), var(--color3));
}

@mixin --only-descs(--arg) {
  color: var(--arg);
  & * { color: var(--arg, red); }
  & + * { color: var(--arg, red); }
}

p {
  --color1: red;
  --color2: red;
  --color3: red;
  @apply --shadowed-values();
}

.foo {
  @apply --only-descs(green);
}
`;

const result = await transform(css, {
    beautify: true,
    evaluateMixins: true,
    expandNestingRules: true
});

console.debug(result.code);
````

result:

```css
p {
 --color1: red;
 --color2: red;
 --color3: red;
 background: linear-gradient(red,green,blue)
}
.foo,.foo * {
 color: green
}
.foo+* {
 color: red
}
````

### Contents block

A mixin can be applied with a contents block, a declaration list. `@contents` is replaced with a copy of that block. When the `@apply` rule has no contents block, `@contents` is replaced with a copy of its own block (the default contents), otherwise it is removed.
The content of `@result` is the result of the mixin.

```css
@mixin --one-column() {
  @media (width <= 800px) {
    @contents;
  }
}

@mixin --just-contents() {
  @contents { color: red; }
}

.a {
  @apply --one-column {
    display: flex;
    flex-flow: column;
  }
}

.foo {
  /* the default contents: color: red */
  @apply --just-contents;
}

.bar {
  /* nothing at all */
  @apply --just-contents {};
}
```

result:

```css
.a {
 @media (width<=800px) {
  display: flex;
  flex-flow: column
 }
}
.foo {
 color: red
}
```

### Typed arguments

The value of a typed argument is computed on the element the mixin is applied to, the descendants inherit the computed value.
When a descendant references a typed argument, the value is stored in a registered custom property that is declared on that element.

```css
@mixin --same-size(--size <length>) {
  @result {
    &, & > * {
      width: calc(10 * var(--size));
    }
  }
}
.parent {
  font-size: 10px;
  @apply --same-size(1em);
}
.parent > .child {
  font-size: 20px;
}
```

result:

```css
@property --same-size-size-1 {
 syntax: "<length>";
 inherits: true;
 initial-value: 0px
}
.parent {
 font-size: 10px;
 --same-size-size-1: 1em;
 & {
  width: 10em
 }
 &>* {
  width: calc(10*var(--same-size-size-1))
 }
 >.child {
  font-size: 20px
 }
}
```

The width of `.parent > .child` is `100px`: `--same-size-size-1` is computed on `.parent`.

## CSS custom functions (experimental)

Evaluate [CSS custom functions](https://drafts.csswg.org/css-mixins-1/#defining-custom-functions): a custom function call is replaced by the result of the function, like `var()` is replaced by the value of a custom property.
This feature is enabled using `{evaluateMixins: true}`.

A call is evaluated when:
- the function is defined only once, outside conditional group rules
- the function body does not contain conditional rules (`@media`, `@supports`, ...)
- the arguments match the parameters: there are no extra arguments, every parameter without a default value has an argument, the arguments, the default values and the result match their types
- the function does not call itself, directly or through other functions
- the call is not located in a custom property declaration, or the function is not typed: the value of a typed argument or result is computed on the element that declares the custom property

Otherwise, the call is left as is, as well as a call that returns an invalid value or no value.
A function whose parameters contain the same name more than once is not valid: it is dropped. The custom functions are not modified when the feature is disabled.

```css
@function --body(
  --one: 10px,
  --two: 20px,
  --three: 30px,
) returns <length> {
  --one: initial; /* the argument: 5px */
  --two: initial; /* the default value: 20px */
  --three: inherit; /* the custom property of the call site: 3px */
  --four: inherit; /* the custom property of the call site: 4px */
  result: calc(var(--one) + var(--two) + var(--three) + var(--four));
}
.foo {
  --one: 1px;
  --two: 2px;
  --three: 3px;
  --four: 4px;
  width: --body(5px); /* 32px */
}

@function --add-a-b-c(--b, --c) {
  --c: 300;
  /* --a from the custom property of the call site, --b from the argument, --c from the local variable */
  result: calc(var(--a) + var(--b) + var(--c));
}
div {
  --a: 1;
  --b: 2;
  --c: 3;
  z-index: --add-a-b-c(20, 30);
}
```

result:

```css
.foo {
 --one: 1px;
 --two: 2px;
 --three: 3px;
 --four: 4px;
 width: 32px
}
div {
 --a: 1;
 --b: 2;
 --c: 3;
 z-index: 321
}
```

The evaluated functions are dropped and replaced with a comment. They are kept using `{keepMixins: true}`.

```ts
import {transform} from '@tbela99/css-parser';

const css = `
@function --double(--v <length>: 1px) returns <length> {
  --two: 2;
  result: calc(var(--two) * var(--v));
}
@function --negative(--value) {
  result: calc(-1 * var(--value));
}
.x {
  width: --double();
  padding: --negative(var(--gap));
}
`;

const result = await transform(css, {
    beautify: true,
    evaluateMixins: true
});

console.debug(result.code);
````

result:

```css
.x {
 width: 2px;
 padding: calc(-1*var(--gap))
}
```

## CSS color-mix() syntax

Convert new color-mix() syntax into legacy color syntax.

```ts
import {transform, ColorType} from '@tbela99/css-parser';

const css = `
table.colortable {
    color: color-mix(firebrick, goldenrod);
}
`;

const result = await transform(css, {
    beautify: true,
    convertColor: ColorType.SRGB
}); 

console.debug(rendered.code);
````

result:

```css
table.colortable {
 color: color(srgb .787974 .417034 .141379)
}
````

## CSS nesting

Expand CSS into legacy syntax.

```ts
import {transform} from '@tbela99/css-parser';

const css = `
table.colortable {
    & td {
        text-align: center;

        &.c {
            text-transform: uppercase
        }

        &:first-child, &:first-child + td {
            border: 1px solid #000
        }
    }

    & th {
        text-align: center;
        background: #000;
        color: #fff
    }
}
`;

const result = await transform(css, {
    beautify: true,
    nestingRules: false
}); 

console.debug(rendered.code);
````

result:

```css
table.colortable td {
 text-align: center
}
table.colortable td.c {
 text-transform: uppercase
}
table.colortable td:is(:first-child,:first-child+td) {
 border: 1px solid #000
}
table.colortable th {
 text-align: center;
 background: #000;
 color: #fff
}
````

------
[← Plugins API](./plugins.md) | [Prefix Removal →](./prefix-removal.md) 