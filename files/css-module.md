---
title: CSS module
group: Documents
category: Guides
---

# CSS Module

CSS module is a feature that allows you to use CSS classes in a way that is safe from conflicts with other classes in the same project.
to enable CSS module support, pass the `module` option to the parse() or transform() function.
for a detailed explanation of the module options, see the [module options](../docs/interfaces/node.ParserOptions.html#module) section.

```typescript

transform(css, {module: true});

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

.r7bhp_goal .gy28g_bg-indigo {
    background: indigo
}
.wims0_indigo-white {
    color: #fff
}
```
generated class mapping

```typescript

{
    goal: 'r7bhp_goal',
    'bg-indigo': 'gy28g_bg-indigo',
    'indigo-white': 'wims0_indigo-white gy28g_bg-indigo qw06e_title',
    title: 'qw06e_title'
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

the `naming` option is used to configure the case of the generated class names as well as the class mapping. check the [naming options](../docs/interfaces/node.ModuleOptions.html#naming) section for more details.

```typescript

import {transform, TransformOptions} from "@tbela99/css-parser";

const options: TransformOptions = {

    module: true,
    beautify: true,
    naming: {
        prefix: 'css',
        separator: '-',
        case: 'camelCase'
    }
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

```

------
[Previous](./validation.md) 