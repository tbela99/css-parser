[![cov](https://tbela99.github.io/css-parser/badges/coverage.svg)](https://github.com/tbela99/css-parser/actions)

# css-parser

CSS parser for node and the browser

## Installation

```shell
$ npm install @tbela99/css-parser

```

## Transform

Parse and render css in a single pass.

### Usage

```javascript

transform(css, transformOptions = {})
```

### Example

```javascript

import {transform} from '@tbela99/css-parser';

const {ast, code, errors, stats} = await transform(css, {compress: true, resolveImport: true, cwd: 'files/css'});
```

### TransformOptions

Include ParseOptions and RenderOptions

#### ParseOptions

- src: string, optional. css file location to be used with sourcemap.
- compress: boolean, optional. default to _true_. optimize ast and minify css.
- removeEmpty: boolean, remove empty nodes from the ast.
- location: boolean, optional. includes node location in the ast, required for sourcemap generation.
- cwd: string, optional. the current working directory. when specified url() are resolved using this value
- resolveImport: boolean, optional. replace @import node by the content of the referenced stylesheet.
- resolveUrls: boolean, optional. resolve css url() according to the parameters 'src' and 'cwd'

#### RenderOptions
- compress: boolean, optional. default to _true_. optimize ast and minify css.
- indent: string, optional. css indention string. uses space character by default.
- newLine: string, new line character.
- removeComments: boolean, remove comments in generated css.
- preserveLicense: boolean, force preserving comments starting with '/\*!' when compress is enabling.
- colorConvert: boolean, convert colors to hex.


## Parsing

### Usage

```javascript

parse(css, parseOptions = {})
```

### Example

````javascript

const {ast, errors} = await parse(css);
````

## Rendering

### Usage

```javascript
render(ast, RenderOptions = {});
```

### Example

```javascript
import {render} from '@tbela99/css-parser';

// minified
const {code} = render(ast, {compress: true});

console.log(code);
```

## Node Walker

```javascript
import {walk} from '@tbela99/css-parser';

for (const {node, parent, root} of walk(ast)) {
    
    // do somehting
}
```

## Exports

There are several ways to import the library into your application.

### Node exports

import as a module

```javascript

import {transform} from '@tbela99/css-parser';

// ...
```
import as a CommonJS module

```javascript

import {transform} from '@tbela99/css-parser/cjs';

// ...
```

### Web export

Programmatic import

```javascript

import {transform} from '@tbela99/css-parser/web';

// ...
```

Javascript module

```javascript

<script src="dist/web/index.js" type="module"></script>
```

Single JavaScript file

```javascript

<script src="dist/index-umd-web.js"></script>
```

## AST

### Comment

- typ: string 'Comment'
- val: string, the comment

### Declaration

- typ: string 'Declaration'
- nam: string, declaration name
- val: array of tokens

### Rule

- typ: string 'Rule'
- sel: string, css selector
- chi: array of children

### AtRule

- typ: string 'AtRule'
- nam: string. AtRule name
- val: rule prelude

### AtRuleStyleSheet

- typ: string 'Stylesheet'
- chi: array of children