---
title: Parsing
group: Documents
category: Guides
---

## Parsing CSS

Parsing will turn the input css into an AST (Abstract Syntax Tree). It is achieved using the functions `parse()` and `transform()` or by using the corresponding functions `parseFile()` and `transformFile()`. `parse()` and `parseFile()` will not produce any css. To the contrary, the `transform()` and `transformFile()` functions will parse and also produce the CSS code, which comes handing if you do not want an additional step to render the ast.

```ts
import {parse, render} from '@tbela99/css-parser';

const css = `...`;

const result = await parse(css);
console.debug(result.ast);
console.debug(result.stats);

const rendered = render(result.ast);
console.debug(rendered.code);
console.debug(result.stats);
````

or

```ts
import {transform} from '@tbela99/css-parser';

const css = `...`;

const result = await transform(css);
console.debug(result.ast);
console.debug(result.code);
console.debug(result.stats);
````

### Parsing Options

> Minify Options

- minify: boolean, optional. default to _true_. optimize ast.
- pass: number, optional. minification passes. default to 1
- nestingRules: boolean, optional. automatically generated nested rules.
- expandNestingRules: boolean, optional. convert nesting rules into separate rules. will automatically set nestingRules
  to false.
- expandIfSyntax: experimental, convert css if() function into legacy syntax.
- removeDuplicateDeclarations: boolean, optional. remove duplicate declarations.
- computeTransform: boolean, optional. compute css transform functions.
- computeShorthand: boolean, optional. compute shorthand properties.
- computeCalcExpression: boolean, optional. evaluate calc() expression
- inlineCssVariables: boolean, optional. replace some css variables with their actual value. they must be declared once
  in the :root {} or html {} rule.
- removeEmpty: boolean, optional. remove empty rule lists from the ast.

> CSS modules Options

- module: boolean | ModuleCaseTransformEnum | ModuleScopeEnumOptions | ModuleOptions, optional. css modules options.

> CSS Prefix Removal Options

- removePrefix: boolean, optional. remove CSS prefixes.

> Validation Options

- validation: ValidationLevel | boolean, optional. enable validation. permitted values are:
    - ValidationLevel.None: no validation
    - ValidationLevel.Default: validate selectors and at-rules (default)
    - ValidationLevel.All. validate all nodes
    - true: same as ValidationLevel.All.
    - false: same as ValidationLevel.None
- lenient: boolean, optional. preserve invalid tokens.

> Sourcemap Options

- src: string, optional. original css file location to be used with sourcemap, also used to resolve url().
- sourcemap: boolean, optional. preserve node location data.

> Ast Traversal Options

- visitor: VisitorNodeMap, optional. node visitor used to transform the ast.

> Urls and \@import Options

- resolveImport: boolean, optional. replace @import rule by the content of the referenced stylesheet.
- resolveUrls: boolean, optional. resolve css 'url()' according to the parameters 'src' and 'cwd'

> Misc Options
- removeCharset: boolean, optional. remove @charset.
- cwd: string, optional. destination directory used to resolve url().
- signal: AbortSignal, optional. abort parsing.
See [ParserOptions](../interfaces/node.ParserOptions.html)

### Usage

```javascript

parse(css, parseOptions = {})
```

### Example

````javascript

const {ast, errors, stats} = await parse(css);
````

### Parsing files

The parseFile() and transformFile() functions can be used to parse files.
They both accept a file url or path as first argument.

```ts
import {transformFile} from '@tbela99/css-parser';

const css = `https://docs.deno.com/styles.css`;

let result = await transformFile(css);
console.debug(result.code);

// load file as readable stream
result = await transformFile(css, true);
console.debug(result.code);
```

### Parsing from a Readable Stream

The parse() and transform() functions accept a string or readable stream as first argument.

```ts
import {parse} from '@tbela99/css-parser';
import {Readable} from "node:stream";

// usage: node index.ts < styles.css or cat styles.css | node index.ts

const readableStream = Readable.toWeb(process.stdin);
const result = await parse(readableStream, {beautify: true});

console.log(result.ast);
```

A response body object can also be passed to parseFile() or transformFile() functions

```ts

import {transformFile} from '@tbela99/css-parser';

const response = await fetch(`https://docs.deno.com/styles.css`);
const result = await transformFile(response.body); // or parse(response.body)
console.debug(result.code);

```

## Transform

The transform function parse and render css.

### TransformOptions

Include ParseOptions and RenderOptions

### Example

```javascript

import {transform} from '@tbela99/css-parser';

const {ast, code, map, errors, stats} = await transform(css, {minify: true, resolveImport: true, cwd: 'files/css'});
```

### Example

Read from stdin with node using readable stream

```typescript
import {transform} from "../src/node";
import {Readable} from "node:stream";
import type {TransformResult} from '../src/@types/index.d.ts';

const readableStream: ReadableStream<string> = Readable.toWeb(process.stdin) as ReadableStream<string>;
const result: TransformResult = await transform(readableStream, {beautify: true});

console.log(result.code);
```

### CSS if() function expansion

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

------
[← Usage](../documents/Guide.Usage.html) | [Rendering →](../documents/Guide.Rendering.html) 

