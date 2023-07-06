# css-parser

CSS parser for node and the browser

## Installation

```shell
$ npm install @tbela99/css-parser
```

## Transform

Parse and render css in a single pass.

```javascript
import {transform} from '@tbela99/css-parser';

const {ast, code, errors, stats} = transform(css);
```

### Usage

```javascript

transform(css, transformOptions = {})
```
### TransformOptions

Include both ParseOptions and RenderOptions

- src: string, optional. css file location to be used with sourcemap.
- location: boolean, optional. includes node location in the ast, required for sourcemap generation.
- processImport: boolean, process @import node - not yet implemented
- compress: boolean, default to _true_. optimize ast and minify css.
- removeEmpty: boolean, remove empty nodes from the ast.
- indent: string, optional. css indention string. uses space character by default.
- newLine: string, new line character.
- removeComments: boolean, remove comments in generated css.
- preserveLicense: boolean, force preserving comments starting with '/\*!' when compress is enabling.


## Parsing

```javascript
import {parse} from '@tbela99/css-parser';

const {ast, errors} = parse(css);
```

### Usage

```javascript

parse(css, parseOptions = {})
```
### ParseOptions

- src: string, optional. css file location
- location: boolean, optional. includes node location in the ast
- processImport: boolean, process @import node - not yet implemented
- deduplicate: boolean, remove duplicate node and merge rules
- removeEmpty: boolean, remove empty nodes


## Rendering

### Usage

```javascript
import {render} from '@tbela99/css-parser';

// pretty print
const prettyPrint = render(ast);
// minified
const {code} = render(ast, {compress: true});

console.log(code);
```

### RenderOptions

- compress: boolean, optional. minify output. Also remove comments
- indent: string, optional. indention string. uses space character by default.
- newLine: string, new line character
- removeComments: boolean, remove comments
- preserveLicense: boolean, force preserving comments starting with '/\*!'

## Node Walker

```javascript
import {walk} from '@tbela99/css-parser';

for (const {node, parent, root} of walk(ast)) {
    
    // do somehting
}
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