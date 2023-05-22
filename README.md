# css-parser

CSS parser for node and the browser

## Installation

```shell
$ npm install @tbela99/css-parser
```

## Parsing

```javascript

const {ast, errors} = parse(css);
```

### Usage

```javascript

parse(css, parseOptions = {})
```
### parseOptions

- src: string, optional. css file location
- location: boolean, optional. includes node location in the ast
- processImport: boolean, process @import node - not yet implemented
- deduplicate: boolean, remove duplicate node and merge rules
- removeEmpty: boolean, remove empty nodes


## Rendering
### Usage

```javascript
// pretty print
const prettyPrint = render(ast);
// minified
const minified = render(ast, {compress: true})
```

### Rendering options

- compress: boolean, optional. minify output. Also remove comments
- indent: string, optional. indention string. uses space character by default.
- newLine: string, new line character
- removeComments: boolean, remove comments

## AST

### Comment

- typ: string 'Comment'
- val: string, the comment

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