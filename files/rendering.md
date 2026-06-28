---
title: Rendering
group: Documents
category: Guides
---

## Rendering CSS

[Rendering options](../interfaces/node.RenderOptions.html) can be passed to both transform() and render() functions.

### RenderOptions

> Minify Options

- beautify: boolean, optional. default to _false_. beautify css output.
- minify: boolean, optional. default to _true_. minify css values.
- withParents: boolean, optional. render this node and its parents.
- removeEmpty: boolean, optional. remove empty rule lists from the ast.
- expandNestingRules: boolean, optional. expand nesting rules.
- preserveLicense: boolean, force preserving comments starting with '/\*!' when minify is enabled.
- removeComments: boolean, remove comments in generated css.
- convertColor: boolean | ColorType, convert colors to the specified color. default to ColorType.HEX. supported values are:
  - true: same as ColorType.HEX
  - false: no color conversion
  - ColorType.HEX
  - ColorType.RGB or ColorType.RGBA
  - ColorType.HSL
  - ColorType.HWB
  - ColorType.CMYK or ColorType.DEVICE_CMYK
  - ColorType.SRGB
  - ColorType.SRGB_LINEAR
  - ColorType.DISPLAY_P3
  - ColorType.PROPHOTO_RGB
  - ColorType.A98_RGB
  - ColorType.REC2020
  - ColorType.XYZ or ColorType.XYZ_D65
  - ColorType.XYZ_D50
  - ColorType.LAB
  - ColorType.LCH
  - ColorType.OKLAB
  - ColorType.OKLCH

> Sourcemap Options

- sourcemap: boolean | 'inline', optional. generate sourcemap. 

> Misc Options

- indent: string, optional. css indention string. uses space character by default.
- newLine: string, optional. new line character.
- output: string, optional. file where to store css. url() are resolved according to the specified value. no file is
  created though.
- cwd: string, optional. destination directory used to resolve url().

### Usage

```javascript
render(ast, RenderOptions = {});
```

### Examples

Rendering ast

```javascript
import {parse, render} from '@tbela99/css-parser';

const css = `
@media screen and (min-width: 40em) {
    .featurette-heading {
        font-size: 50px;
    }
    .a {
        color: red;
        width: 3px;
    }
}
`;

const result = await parse(css, options);

// print declaration without parents
console.error(render(result.ast.chi[0].chi[1].chi[1], {withParents: false}));
// -> width:3px

// print declaration with parents
console.debug(render(result.ast.chi[0].chi[1].chi[1], {withParents: true}));
// -> @media screen and (min-width:40em){.a{width:3px}}

```

### Pretty printing
By default, CSS output is minified. That behavior can be changed by passing the option `{beautify:true}`.

```ts

const result = await transform(css, {beautify: true}); 
// or render(ast, {beautify: true})

console.log(result.code);

```

### Preserving license comments

By default all comments are removed from the output. They can be preserved by passing the `{removeComments:false}` option,

If you only want to preserve license comments, and remove other comments, you can pass `{preserveLicense:true}` instead.

```ts

const css = `/*!
 * Bootstrap  v5.3.3 (https://getbootstrap.com/)
 * Copyright 2011-2024 The Bootstrap Authors
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */
[data-bs-theme=dark] {
 color-scheme: dark;
 
 ...`;

const result = await transform(css, {preserveLicense: true}); 
```

### Converting colors

Color conversion is controlled by the `convertColor` option. Colors are converted to the HEX format by default.
That behavior can be changed by passing the desired color type to the convertColor option:

- ColorType.HEX
- ColorType.RGB or ColorType.RGBA
- ColorType.HSL or ColorType.HSLA
- ColorType.HWB or ColorType.HWBA
- ColorType.CMYK or ColorType.DEVICE_CMYK
- ColorType.SRGB
- ColorType.SRGB_LINEAR
- ColorType.DISPLAY_P3
- ColorType.PROPHOTO_RGB
- ColorType.A98_RGB
- ColorType.REC2020
- ColorType.XYZ or ColorType.XYZ_D65
- ColorType.XYZ_D50
- ColorType.LAB
- ColorType.LCH
- ColorType.OKLAB
- ColorType.OKLCH

```ts
import {transform, ColorType} from '@tbela99/css-parser';

const css = `
.color-map {

color: lab(from #123456 calc(l + 10) a b);
background-color: lab(from hsl(180 100% 50%) calc(l - 10) a b);
}
`;
const result = await transform(css, {
    beautify: true,
    convertColor: ColorType.RGB,
    computeCalcExpression: true
});

console.log(result.code);

// .color-map {
//     color: rgb(45 74 111);
//     background-color: rgb(0 226 226)
// }
```

------
[← Parsing](./parsing.md) | [Validation →](./validation.md) 

