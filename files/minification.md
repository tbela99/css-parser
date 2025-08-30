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

this feature is enaled by default. it can be disabled using `{computeCalcExpression: false}`.
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

### Transform functions

compute css transform functions and preserve the shortest possible value. this feature is enabled by default. it can be disabled using `{computeTransform: false}`.
this feature is enabled by default.

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

### Merge adjacent rules

adjacent rules with common declarations and at-rules with the same name and prelude are merged.

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

this feature is enabled by default. it can be disabled using `{cssNesting: false}`.
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

            beautify: true
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
        border: 1px solid #ddd;
        padding: 8px
    }
    & tr {
        &:nth-child(even) {
            background-color: #f2f2f2
        }
        &:hover {
            background-color: #ddd
        }
    }
    & th {
        padding-top: 12px;
        padding-bottom: 12px;
        text-align: left;
        background-color: #4CAF50;
        color: #fff
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
