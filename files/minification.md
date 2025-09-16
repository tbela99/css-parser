---
title: Minification
group: Documents
category: Guides
---

## Minification

the minification process is the default behavior. it applies to both the ast and the css output.
it can be disabled by setting `{minify:false}` in the options.

individual flags can be set to control specific minification features.

### Keyframes

keyframes rules are minified.

```ts

import {transform, TransformOptions} from "@tbela99/css-parser";

const options: TransformOptions = {

    beautify: true,
};

const css = `@keyframes slide-in {
  from {
    transform: translateX(0%);
  }

  100% {
    transform: translateX(100%);
  }
}
    `;

const result = await transform(css, options);

console.debug(result.code);

```

output
```css
@keyframes slide-in {
    0% {
        transform: translateX(0)
    }
    to {
        transform: translateX(100%)
    }
}
```

### CSS variables inlining

this feature is disabled by default.
it can be enabled using `{inlineCssVariables: true}`.
the CSS variables must be defined only once, and they must be defined in 'html' or ':root' selectors.

```ts

import {transform, ColorType} from '@tbela99/css-parser';

const css = `
:root {
--color: green;
}
._19_u :focus {
    color:  hsl(from var(--color) calc(h * 2) s l);
}
`;
const result = await transform(css, {
    beautify: true,
    convertColor: false,
    inlineCssVariables: true,
    computeCalcExpression: false
});

console.log(result.code);

```

output
```css
._19_u :focus {
 color: hsl(from green calc((h*2)) s l)
}
```

### Math functions

this feature is enabled by default. it can be disabled using `{computeCalcExpression: false}`.
[math functions](../variables/node.mathFuncs.html) such as `calc()` are evaluated when enabled using `{computeCalcExpression: true}`.

```ts

import {transform, ColorType} from '@tbela99/css-parser';

const css = `
:root {
--color: green;
}
._19_u :focus {
    color:  hsl(from var(--color) calc(h * 2) s l);
}
`;
const result = await transform(css, {
    beautify: true,
    inlineCssVariables: true,
    computeCalcExpression: true
});

console.log(result.code);

```

output

```css
._19_u :focus {
 color: navy
}
```

### Color minification

CSS colors level 4&5 are fully supported. the library will convert between all supported color formats.
it can also compute relative colors and color-mix() functions.

```ts

import {transform, ColorType, TransformOptions} from '@tbela99/css-parser';

const options: TransformOptions = {

    beautify: true,
};

const css = `

.color1 {
    --color1: color(from green srgb r g b / 0.5);
    --color2: color(from #123456 xyz calc(x + 0.75) y calc(z - 0.35));
    --color3: 
color(display-p3 1 0.5 0);
--color4: color(display-p3 1 0.5 0 / .5);
--color5: color-mix(in lab, plum 60%, #123456 50%);
--color6: color-mix(in lch longer hue, hsl(200deg 50% 80%), coral);
}
    `;

const result = await transform(css, options);

console.debug(result.code);

```

output

```css
.color1 {
 --color1: #00800080;
 --color2: red;
 --color3: #ff7600;
 --color4: #ff760080;
 --color5: #816d9d;
 --color6: #88ca86
}
```

the color result color format can be specified using the `convertColor` option.

```ts

import {transform, ColorType, TransformOptions} from '@tbela99/css-parser';

const options: TransformOptions = {

    beautify: true,
        convertColor: ColorType.OKLCH
};

const css = `

.color1 {
    --color1: color(from green srgb r g b / 0.5);
    --color2: color(from #123456 xyz calc(x + 0.75) y calc(z - 0.35));
    --color3: 
color(display-p3 1 0.5 0);
--color4: color(display-p3 1 0.5 0 / .5);
--color5: color-mix(in lab, plum 60%, #123456 50%);
--color6: color-mix(in lch longer hue, hsl(200deg 50% 80%), coral);
}
    `;

const result = await transform(css, options);

console.debug(result.code);

```

output

```css
.color1 {
    --color1: oklch(.519752 .176858 142.495/50%);
    --color2: oklch(.473385 .954378 47.1833);
    --color3: oklch(.742513 .219804 51.1597);
    --color4: oklch(.742513 .219804 51.1597/50%);
    --color5: oklch(.572282 .075648 303.425);
    --color6: oklch(.77643 .115501 143.964)
}
```

### Transform functions

compute css transform functions and preserve the shortest possible value. this feature is enabled by default. it can be disabled using `{computeTransform: false}`.

```ts

import {transform, ColorType} from '@tbela99/css-parser';

const css = `

.now {
    transform: scaleX(1) scaleY(1) ;
}

  .now1 {
    transform: scaleX(1.5)  scaleY(2);
}
`;
const result = await transform(css);

console.log(result.code);

```

output
```css
.now{transform:none}.now1{transform:scale(1.5,2)}
```

### CSS values

dimension and numeric values are minified.

```ts

import {transform} from '@tbela99/css-parser';

const css = `

.now {
    width: 0px;
}
`;
const result = await transform(css);

console.log(result.code);

```

output

```css
.now{width:0}
```

### Redundant declarations

by default, only the last declaration is preserved.
to preserve all declarations, pass the option `{removeDuplicateDeclarations: false}`.

```ts

import {transform} from '@tbela99/css-parser';

const css = `

.table {

    width: 100%;
    width: calc(100% + 40px);
    margin-left: 20px;
    margin-left: min(100% , 20px)
}
    
`;
const result = await transform(css, {

            beautify: true,
            validation: true,
            removeDuplicateDeclarations: false
        }
);

console.log(result.code);

```
output

```css
.table {
 width: 100%;
 width: calc(100% + 40px);
 margin-left: 20px;
 margin-left: min(100%,20px)
}
```

to preserve only specific declarations, pass an array of declaration names to preserve

```ts

import {transform} from '@tbela99/css-parser';

const css = `

.table {

    width: 100%;
    width: calc(100% + 40px);
    margin-left: 20px;
    margin-left: min(100% , 20px)
}
    
`;
const result = await transform(css, {

    beautify: true,
    validation: true,
    removeDuplicateDeclarations: ['width']
}
);

console.log(result.code);

```
output

```css
.table {
 width: 100%;
 width: calc(100% + 40px);
 margin-left: min(100%,20px)
}
```

### Merging adjacent rules

adjacent rules with common declarations and at-rules with the same name and prelude are merged.

```ts

const options: TransformOptions = {

    beautify: true,
    validation: true,
    removeDuplicateDeclarations: ['background', 'width']
};

const css = `

@media tv {

  .rule {
    
    width: 100%;
    width: calc(100% + 40px);
    margin-left: min(100% , 20px)
  }
}
    
@media tv {

  .rule {
    
    margin-left: min(100% , 20px)
  }
}

    #converted-text { color: color(from green display-p3 r calc(g + .2) b ); 
      background: -o-linear-gradient(top, white, black);
      background: -webkit-gradient(linear, left top, left bottom, from(white), to(black));
      background: linear-gradient(to bottom, white, black);}
    `;

const result = await transform(css, options);

console.debug(result.code);

```

output

```css
@media tv {
 .rule {
  width: 100%;
  width: calc(100% + 40px);
  margin-left: min(100%,20px)
 }
}
#converted-text {
 color: #00b400;
 background: -o-linear-gradient(top,#fff,#000);
 background: -webkit-gradient(linear,left top,left bottom,from(#fff),to(#000));
 background: linear-gradient(to bottom,#fff,#000)
}
```

### Conditional wrapping or unwrapping selectors using :is()

this feature is enabled by default. it can be disabled by turning off minification using `{minify: false}`.
it will attempt to wrap or unwrap rules using :is() and use the shortest possible selector.

```ts

import {transform} from '@tbela99/css-parser';

const css = `

.table {
    border-collapse: collapse;
    width: 100%;
}
    
.table td,  .table  th,  .table tr {
    border: 1px solid #ddd;
    padding: 8px;
}
`;
const result = await transform(css, {

            beautify: true,
            nestingRules: false
        }
);

console.log(result.code);

```

output
```css
.table {
    border-collapse: collapse;
    width: 100%
}
.table:is(td,th,tr) {
    border: 1px solid #ddd;
    padding: 8px
}
```

### CSS Nesting

this feature is enabled by default. it can be disabled using `{nestingRules: false}`.
when enabled, css rules are automatically nested.

```ts

import {transform} from '@tbela99/css-parser';

const css = `

.table {
    border-collapse: collapse;
    width: 100%;
}
    
.table td, .table th {
    border: 1px solid #ddd;
    padding: 8px;
}
    
.table tr:nth-child(even){background-color: #f2f2f2;}
    
.table tr:hover {background-color: #ddd;}
    
.table th {
    padding-top: 12px;
    padding-bottom: 12px;
    text-align: left;
    background-color: #4CAF50;
    color: white;
}
`;
const result = await transform(css, {

            beautify: true,
    convertColor: ColorType.OKLCH
        }
);

console.log(result.code);

```

output
```css
.table {
    border-collapse: collapse;
    width: 100%;
    & td,& th {
        border: 1px solid oklch(.897547 0 0);
        padding: 8px
    }
    & tr {
        &:nth-child(2n) {
            background-color: oklch(.961151 0 0)
        }
        &:hover {
            background-color: oklch(.897547 0 0)
        }
    }
    & th {
        padding-top: 12px;
        padding-bottom: 12px;
        text-align: left;
        background-color: oklch(.673098 .162442 144.208);
        color: oklch(1 0 0)
    }
}
```

### UTF-8 escape sequence

utf-8 escape sequences are decoded and replaced by their corresponding characters.

### Experimental CSS prefix removal

this feature is disabled by default. the prefixed versions of the css gradient functions are not supported.

```ts   

import {transform} from '@tbela99/css-parser';

const css = `

::-webkit-input-placeholder {
    color: gray;
  }
  
  ::-moz-placeholder {
    color: gray;
  }
  
  :-ms-input-placeholder {
    color: gray;
  }
  
  ::-ms-input-placeholder {
    color: gray;
  }
  
  ::placeholder {
    color: gray;
  }
  
  @supports selector(:-ms-input-placeholder) {
  
  
  :-ms-input-placeholder {
    color: gray;
  }
  }

@media (-webkit-min-device-pixel-ratio: 2), (-o-min-device-pixel-ratio: 2/1), (min-resolution: 2dppx) {
    .image {
      background-image: url(image@2x.png);
    }
  
  }
  
  
  @-webkit-keyframes bar {
  
  from, 0% {
  
  height: 10px;
  }
  }
  
  @keyframes bar {
  
  from, 0% {
  
  height: 10px;
  }
  }
  .example {
  
      -moz-animation: bar 1s infinite;
      display: -ms-grid;
      display: grid;
      -webkit-transition: all .5s;
      -o-transition: all .5s;
      transition: all .5s;
      -webkit-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none;
      background: -o-linear-gradient(top, white, black);
      background: -webkit-gradient(linear, left top, left bottom, from(white), to(black));
      background: linear-gradient(to bottom, white, black);
  }
  
  .site{
     display:-ms-grid;
     display:grid;   -ms-grid-columns:2fr 1fr;
     grid-template-columns:2fr 1fr;
     grid-template-areas:"header header"
                         "title sidebar"
                         "main sidebar"
                         "footer footer";
  }
  .site > *{padding:30px; color:#fff; font-size:20px;}
  .mastheader{
     -ms-grid-row:1;
     -ms-grid-column:1;
     -ms-grid-column-span:2;
     grid-area:header;
  }
  .page-title{
     -ms-grid-row:2;
     -ms-grid-column:1;
     grid-area:title;
  }
  .main-content{
     -ms-grid-row:3;
     -ms-grid-column:1;
     grid-area:main;
  }
  .sidebar{
     -ms-grid-row:2;
     -ms-grid-row-span:2;
     -ms-grid-column:2;
     grid-area:sidebar;
  }
  .footer{
     -ms-grid-row:4;
     -ms-grid-column:1;
     -ms-grid-column-span:2;
     grid-area:footer;
  }
`;
const result = await transform(css, {

            beautify: true,
            removePrefix: true
        }
);

console.log(result.code);
```

output
```css
::placeholder {
 color: grey
}
@supports selector(::placeholder) {
 ::placeholder {
  color: grey
 }
}
@media (min-resolution:2x),(-o-min-device-pixel-ratio:2/1),(min-resolution:2x) {
 .image {
  background-image: url(image@2x.png)
 }
}
@keyframes bar {
 0% {
  height: 10px
 }
}
.example,.site {
 display: grid
}
.site {
 grid-template-columns: 2fr 1fr;
 grid-template-areas: "header header""title sidebar""main sidebar""footer footer"
}
.example {
 animation: bar 1s infinite;
 transition: .5s;
 user-select: none;
 background: linear-gradient(to bottom,#fff,#000)
}
.site>* {
 padding: 30px;
 color: #fff;
 font-size: 20px
}
.mastheader {
 grid-row: 1;
 grid-column: 1;
 grid-column-end: 2;
 grid-area: header
}
.page-title {
 grid-row: 2;
 grid-column: 1;
 grid-area: title
}
.main-content {
 grid-row: 3;
 grid-column: 1;
 grid-area: main
}
.sidebar {
 grid-row: 2;
 grid-row-end: 2;
 grid-column: 2;
 grid-area: sidebar
}
.footer {
 grid-row: 4;
 grid-column: 1;
 grid-column-end: 2;
 grid-area: footer
}
```

### Shorthands

shorthand properties are computed and default values are removed.

```ts
import {transform} from '@tbela99/css-parser';

const css = `

.table {

    margin-left: 25px;
    margin-top: 20px;
    margin-right: 25px;
    margin-bottom: 15px;
}
    
`;
const result = await transform(css, {

            beautify: true,
        }
);

console.log(result.code);

```

output

```css
.table {
 margin: 20px 25px 15px
}
```

#### Computed shorthands properties

list of computed shorthands properties:

- [ ] ~all~
- [x] animation
- [x] background
- [x] border
- [ ] border-block-end
- [ ] border-block-start
- [x] border-bottom
- [x] border-color
- [ ] border-image
- [ ] border-inline-end
- [ ] border-inline-start
- [x] border-left
- [x] border-radius
- [x] border-right
- [x] border-style
- [x] border-top
- [x] border-width
- [x] column-rule
- [x] columns
- [x] container
- [ ] contain-intrinsic-size
- [x] flex
- [x] flex-flow
- [x] font
- [ ] font-synthesis
- [ ] font-variant
- [x] gap
- [ ] grid
- [ ] grid-area
- [ ] grid-column
- [ ] grid-row
- [ ] grid-template
- [x] inset
- [x] list-style
- [x] margin
- [ ] mask
- [ ] offset
- [x] outline
- [x] overflow
- [x] padding
- [ ] place-content
- [ ] place-items
- [ ] place-self
- [ ] scroll-margin
- [ ] scroll-padding
- [ ] scroll-timeline
- [x] text-decoration
- [x] text-emphasis
- [x] transition
