---
title: CSS Modules
group: Documents
category: Guides
---

# CSS Modules

CSS module is a feature that allows you to use CSS classes in a way that is safe from conflicts with other classes in the same project.
to enable CSS module support, pass the `module` option to the parse() or transform() function.
for a detailed explanation of the module options, see the [module options](../docs/interfaces/node.ParserOptions.html#module) section.

```typescript

parse(css, {module: boolean | ModuleCaseTransformEnum | ModuleScopeEnumOptions | ModuleOptions});
transform(css, {module: boolean | ModuleCaseTransformEnum | ModuleScopeEnumOptions | ModuleOptions});

parseFile(css, {module: boolean | ModuleCaseTransformEnum | ModuleScopeEnumOptions | ModuleOptions});
transformFile(css, {module: boolean | ModuleCaseTransformEnum | ModuleScopeEnumOptions | ModuleOptions});

```

## Scope

the `scoped` option is used to configure the scope of the generated class names.

### Local scope

this is the default scope.

```typescript

import {transform, TransformOptions} from "@tbela99/css-parser";
import type {TransformResult} from "@tbela99/css-parser";

const css = `
.className {
  background: red;
  color: yellow;
}

.subClass {
  composes: className;
  background: blue;
}
`;

let result: TransformResult = await transform(css, {

    beautify: true,
    module: {scoped: ModuleScopeEnumOptions.Local
    }
});

console.log(result.code);
```

output

```css
.className_vjnt1 {
    background: red;
    color: #ff0
}
.subClass_sgkqy {
    background: blue
}
```

### Global scope

the class names are not scoped unless they are scoped using :local or :local()

```typescript

result = await transform(css, {

    beautify: true,
    module: {scoped: ModuleScopeEnumOptions.Global
    }

});

console.log(result.code);
```

output

```css
.className {
    background: red;
    color: #ff0
}
.subClass {
    background: blue
}
```

### ICSS scope

export css using ICSS format 
```typescript

 result = await transform(css, {

    beautify: true,
    module: {scoped: ModuleScopeEnumOptions.ICSS
    }

});

console.log(result.code);
```

output

```css
:export {
    className: className_vjnt1;
    subClass: subClass_sgkqy className_vjnt1;
}
.className_vjnt1 {
    background: red;
    color: #ff0
}
.subClass_sgkqy {
    background: blue
}
```

### Pure scope

require to use at least one id or class in selectors. it will throw an error it there are no id or class name in the selector.

```typescript

 result = await transform(css, {

    beautify: true,
    module: {scoped: ModuleScopeEnumOptions.Pure
    }

});

console.log(result.code);
```

output

```css
.className {
    background: red;
    color: #ff0
}
.subClass {
    background: blue
}
```

### Shortest Scope

produce short scope names.

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

### Mixing scopes

scopes can be mixed using the bitwise OR operator '|'

```typescript

 result = await transform(css, {

    beautify: true,
    module: {scoped: ModuleScopeEnumOptions.Pure | ModuleScopeEnumOptions.Global | ModuleScopeEnumOptions.ICSS
    }

});

console.log(result.code);
```

## Class composition

class composition is supported using the `composes` property.

```typescript

import {transform, TransformOptions} from "@tbela99/css-parser";

const options: TransformOptions = {

    module: true,
    beautify: true,
};

const result = await transform(`
.goal .bg-indigo {
  background: indigo;
}

.indigo-white {
  composes: bg-indigo title;
  color: white;
}
`, options);

console.log(result.code);
console.log(result.mapping);


```

generated css code

```css
.goal_r7bhp .bg-indigo_gy28g {
 background: indigo
}
.indigo-white_wims0 {
 color: #fff
}
```
generated class mapping

```json

{
    "goal": "goal_r7bhp",
    "bg-indigo": "bg-indigo_gy28g",
    "indigo-white": "indigo-white_wims0 bg-indigo_gy28g title_qw06e",
    "title": "title_qw06e"
}
```

classes can be composed from other files as well as the global scope

```typescript

import {transform, TransformOptions} from "@tbela99/css-parser";

const options: TransformOptions = {

    module: true,
    beautify: true,
};

const result = await transform(`
.goal .bg-indigo {
  background: indigo;
}

.indigo-white {
  composes: bg-indigo;
  composes: title block ruler from global;
  composes: bg-indigo title from './other-file.css';
  color: white;
}
`, options);

```

## Naming

the `naming` option is used to configure the case of the generated class names as well as the class mapping. 

### Ignore Case

no case transformation

```typescript

import {transform, ModuleCaseTransformEnum} from '@tbela99/css-parser';
import type {TransformResult} from '@tbela99/css-parser';

let css = `

:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
`;

let result = await transform(css, {

    module: {
        naming: ModuleCaseTransformEnum.IgnoreCase
    }

});

console.log(result.code);
```
### Camel case

use camel case for the mapping key names

```typescript

import {transform, ModuleCaseTransformEnum} from '@tbela99/css-parser';
import type {TransformResult} from '@tbela99/css-parser';

let css = `

:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
`;

let result = await transform(css, {

    module: {
        naming: ModuleCaseTransformEnum.CamelCaseOnly
    }

});

console.log(result.code);
```
generated css
```css
.class-name_agkqy {
 background: red;
 color: #ff0
}
.sub-class_nfjpx {
 background: blue
}
```
generated mapping

```ts
console.log(result.mapping);
```
```json
{
 "className": "class-name_agkqy",
 "subClass": "sub-class_nfjpx"
}
```

### Camel case only

use camel case key names and the scoped class names

```typescript

import {transform, ModuleCaseTransformEnum} from '@tbela99/css-parser';
import type {TransformResult} from '@tbela99/css-parser';

let css = `

:local(.class-name) {
  background: red;
  color: yellow;
}

:local(.sub-class) {
  composes: class-name;
  background: blue;
`;

let result = await transform(css, {

    module: {
        naming: ModuleCaseTransformEnum.CamelCaseOnly
    }

});

console.log(result.code);
```
generated css

```css
.className_agkqy {
 background: red;
 color: #ff0
}
.subClass_nfjpx {
 background: blue
}
```
generated mapping

```ts
console.log(result.mapping);
```
```json
{
 "className": "className_agkqy",
 "subClass": "subClass_nfjpx"
}
```

### Dash case

use dash case for the mapping key names

```typescript

import {transform, ModuleCaseTransformEnum} from '@tbela99/css-parser';
import type {TransformResult} from '@tbela99/css-parser';

let css = `

:local(.className) {
  background: red;
  color: yellow;
}

:local(.subClass) {
  composes: className;
  background: blue;
}
`;

let result = await transform(css, {

    module: {
        naming: ModuleCaseTransformEnum.DashCase
    }

});

console.log(result.code);
```
generated css

```css
.className_vjnt1 {
 background: red;
 color: #ff0
}
.subClass_sgkqy {
 background: blue
}
```
generated mapping

```ts
console.log(result.mapping);
```
```json
{
    "class-name": "className_vjnt1",
    "sub-class": "subClass_sgkqy className_vjnt1"
}
```

### Dash case only

use dash case key names and the scoped class names

```typescript

import {transform, ModuleCaseTransformEnum} from '@tbela99/css-parser';
import type {TransformResult} from '@tbela99/css-parser';

let css = `

:local(.className) {
  background: red;
  color: yellow;
}

:local(.subClass) {
  composes: className;
  background: blue;
}
`;

let result = await transform(css, {

    module: {
        naming: ModuleCaseTransformEnum.DashCaseOnly
    }

});

console.log(result.code);
```
generated css

```css
.class-name_vjnt1 {
 background: red;
 color: #ff0
}
.sub-class_sgkqy {
 background: blue
}
```
generated mapping

```ts
console.log(result.mapping);
```
```json
{
    "class-name": "class-name_vjnt1",
    "sub-class": "sub-class_sgkqy class-name_vjnt1"
}
```

## Pattern

the `pattern` option is used to configure the generated scoped names.

```typescript

import {transform, ModulePatternEnum} from '@tbela99/css-parser';
import type {TransformResult} from '@tbela99/css-parser';

const css = `
.className {
  background: red;
  color: yellow;
}

.subClass {
  composes: className;
  background: blue;
}
`;

let result: TransformResult = await transform(css, {

    beautify: true,
    module: {
        pattern: '[local]-[hash:sha256]'
    }

});

console.log(result.code);
```
generated css

```css
.className-b629f {
    background: red;
    color: #ff0
}
.subClass-a0c35 {
    background: blue
}
```
generated mapping

```ts
console.log(result.mapping);
```
```json
{
    "className": "className-b629f",
    "subClass": "subClass-a0c35 className-b629f"
}
```
the supported placeholders are:
- name: the file base name without the extension
- hash: the file path hash
- local: the local name
- path: the file path
- folder: the folder name
- ext: the file extension

the pattern placeholders can optionally have a maximum number of characters:
```
pattern: '[local:2]-[hash:5]'
```
the hash pattern can take an algorithm, a maximum number of characters or both:
```
pattern: '[local]-[hash:base64:5]'
```
or
```
pattern: '[local]-[hash:5]'
```
or
```
pattern: '[local]-[hash:sha1]'
```

supported hash algorithms are:
- base64
- hex
- base64url
- sha1
- sha256
- sha384
- sha512
------

[← Usage](./usage.md) | [Minification →]( ../../docs/documents/Guide.Minification.html )  