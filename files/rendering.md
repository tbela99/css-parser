---
title: Rendering
group: Documents
category: Guides
---

## Rendering CSS

[Rendering options](../interfaces/node.RenderOptions.html) can be passed to both transform() and render() functions.

#### Pretty printing
By default, CSS output is minified. That behavior can be changed by passing the option `{beautify:true}`.

```ts

const result = await transform(css, {beautify: true}); 
// or render(ast, {beautify: true})

console.log(result.code);

```

#### Preserving license comments

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

#### Converting colors

Color conversion is controlled by the `convertColor` option. Colors are converted to the HEX format by default.
That behavior can be changed by passing the chosen color type to the convertColor option:

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
.

------
[← Parsing](../documents/Guide.Parsing.html) | [CSS Modules →](../documents/Guide.CSS_modules.html) 

