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

Expanded into legacy syntax.

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
[← Custom Transform](./transform.md) | [Ast Manipulation →](./ast.md) 