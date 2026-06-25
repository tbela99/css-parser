# Changelog

## v1.4.4

- [x] minify transform-origin property
- [ ] convert -webkit-* gradient functions
  - [x] -webkit-gradient() to
    - [x] linear-gradient()
    - [ ] radial-gradient() - not supported
  - [x] -webkit-linear-gradient()
  - [x] -webkit-radial-gradient()
  - [ ] -webkit-repeating-radial-gradient()  
- [ ] minify gradient functions
  - [x] linear-gradient()
  - [x] radial-gradient()
  - [ ] conic-gradient()
  - [x] repeating-linear-gradient()
  - [x] repeating-radial-gradient()
  - [ ] repeating-conic-gradient()

### Bug fixes
- [x] do not minify supports() arguments
- [x] incorrectly parse selector when removePrefix and css module settings are enabled

```css
*,:before,:after {
 box-sizing: border-box
}
```
is parsed and rendered as 

```css
,,*:before:after {
 box-sizing: border-box
}
```
## v1.4.3

### CSS Modules

- [x] Add css module scope 'shortest' to produce short scoped names

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

### CSS if() function

- [x] support if() css function syntax https://drafts.csswg.org/css-values-5/#if-notation
- [x] convert css if() function into legacy syntax

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


### CSS Color Module Level 5 (Draft)
- [x] support contrast-color() https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/contrast-color
- [x] custom color space in color() https://drafts.csswg.org/css-color-5/#custom-color
    - [x] relative color syntax
    - [x] color syntax

### Media Queries
- [x] media queries validation
- [x] automatically generate range media query
- [x] add at-rule() and named-feature() to @support-condition syntax https://drafts.csswg.org/css-conditional-5/#changes-from-L4
- [x] support calc() in media features


```typescript

const css = `

@media (width >= calc(1024px + 50px)) {
  h1 {
    color: Highlight;
  }
}`;

result = await transform(css, {

    beautify: true,
    validation: true
    }

});

console.log(result.code);
```

output

```css
@media (width>=1074px) {
 h1 {
  color: Highlight
 }
}
```

### Ast

- [x] add ast search functions
  - [x] find() search the ast tree and return the first match
  - [x] findAll() search the ast tree and return all matches
  - [x] findLast() search the ast tree and return the last match
  - [x] findByValue() search the ast tree by checking each node's value and return the first match

### Other Changes
- [x] fix parsing bugs
- [x] automatically rename standard declaration names : color-adjust => print-color-adjust
- [x] rewrite parsing and validation logic
    - [x] selector
    - [x] declaration
    - [x] at-rules
        - [x] @charset
        - [x] @color-profile
        - [x] @container
        - [x] @counter-style
        - [x] @custom-media
        - [x] @document
        - [x] @font-face
        - [x] @font-feature-values
        - [x] @font-palette-values
        - [x] @import
        - [x] @keyframes
        - [x] @layer
        - [x] @media 
        - [x] @namespace
        - [x] @page
        - [x] @position-try
        - [x] @property
        - [x] @scope
        - [x] @starting-style
        - [x] @supports
        - [x] @view-transition
- [x] introduce rawToken type to capture unparseable tokens

## v1.4.2

- [x] add css-conditional-5 @support at-rule(<at-keyword-token>) function
- [x] fix bug when using remove prefix #120

## v1.4.0

### CSS Module support

- [x] scoped name generation
- [x] composes:
  - [x] compose from local selector
  - [x] compose from other files
  - [x] compose from global selector
  - [x] comma separated compose list
- [x] :local
- [x] :global
- [x] :local()
- [x] :global()
- [x] selector
- [x] dashed ident (custom properties)
- [x] css at-rule property
- [x] css at-rule value
- [x] keyframe animations
- [x] grid
- [x] naming
  - [x] ignore
  - [x] camelCase
  - [x] camelCaseOnly
  - [x] dashCase
  - [x] dashCaseOnly
- [x] default mode
  - [x] global
  - [x] local
  - [x] pure(at least one class or id)
  - [x] icss
    - [x] :import
    - [x] :export

### Bug Fixes
- [x] fix \<integer\> syntax validation #115

## v1.3.4

- [x] make streaming optional #109
- [x] patch at-rule syntax for @font-feature-value #110
- [x] support percentage in transform() and scale() #111
- [x] allow arrays in visitor definition #112

## v1.3.3

- [x] relative color computation bug #105
- [x] allow duplicated declarations of whitelisted properties #106

## v1.3.2

- [x] add missing return type

## v1.3.1

- [x] generate documentation
- [x] parse input from readable stream
- [x] add parseFile() and transformFile()
- 
## v1.3.0

- [x] numerical and dimension tokens use numbers instead of string
- [x] fix bug when inlineCssVariables is disabled and computeCalcExpression is enabled

## V1.2.0

- [x] convert color to any supported color space #94
- [x] dead code removal #93
- [x] validation syntax update #92

## v1.1.1

- [x] fix bug when css nesting is disabled #89
- [x] validation rules update #87

## v1.1.0

- [x] inline sourcemap
- [x] CSS validation using mdn-data
- [x] prefix removal now remove prefixes from all nodes. prefixed linear gradients are not supported

# v1.0.0

- [x] current color parse error when used in color functions
- [x] minification : CSS transform module level 2
  - [x] translate
  - [x] scale
  - [x] rotate
  - [x] skew
  - [x] perspective                                  
  - [x] matrix
  - [x] matrix3d
- [x] keyframes
    - [x] remove consecutive keyframes with the same name
    - [x] reduce keyframe selector 'from' to '0%'
    - [x] reduce keyframe selector '100%' to 'to'
    - [x] remove keyframe selector ignored declarations
    - [x] merge keyframe rules and declarations
- [x] trim extra space in declaration value 'url() 15%' -> 'url()15%', '1% !important' -> '1%!important'
- [x] allow empty value for css variable declaration '--color: ;'
- [x] change generate nesting rule default to true

# v0.9.1

- [x] minification passes #66
- [x] nesting selector cannot match pseudo element #67

# v0.9.0

validation
- [x] validate invalid pseudo classes
- [x] rewrite selector validation
- [x] lenient mode that preserves 
  - [x] unknown at-rules
  - [x] unknown declarations 
  - [x] unknown pseudo classes

media query level 5
- [x] at-rule custom-media
- [x] at-rule when-else custom media
- [x] at-rule charset validation
- [x] media query error handling
- [x] at-rule container
- [ ] expand at-rule custom-media
- [ ] expand at-rule when-else

selector validation
- [ ] pseudo class arguments validation
- [ ] pseudo class validation

declaration validation
- [ ] validate declaration

error validation
- [ ] when a parent is marked as invalid node, do not parse or validate descendant nodes

# v0.8.0

- [x] validate selectors using mdn data
- [x] at-rules prefix removal
- [x] at rules validation
    - [x] at-rule prelude
    - [x] at-rule body
    - [x] keyframe validation
    - [ ] :not() does not accept pseudo classes
    - [ ] do not validate declarations in @supports
- [ ] declarations validation
- [x] evaluate math functions: calc(), clamp(), min(), max(), round(), mod(), rem(), sin(), cos(), tan(), asin(),
  acos(), atan(), atan2(), pow(), sqrt(), hypot(), log(), exp(), abs(), sign() #49
- [x] incorrectly parse compound selector #51

# v0.7.1

- [x] fix nesting rules expansion #45

# v0.7.0

- [x] fix merging rules
- [ ] experimental CSS prefix removal
    - [x] declaration name
    - [ ] declaration value
    - [ ] exclude -webkit-* gradients
- [x] css selector validation
    - [x] pseudo element
    - [x] partial pseudo class validation. does not validate parameters
    - [x] attribute selector
    - [x] combinator
    - [x] simple selector
    - [x] nested selector
    - [x] strict vs permissive validation: allow unknown items such as pseudo classes
        - [x] allow unknown pseudo classes
        - [x] allow unknown attribute selectors
- [x] strip universal selector when possible

# v0.6.0

- [x] light-dark() color
- [x] system color

## V0.5.4

- [x] incorrectly expand css nesting rules

## v0.5.3

- [x] incorrectly expand css nesting rules

## v0.5.1

- [x] failed to flatten @import when using url() syntax

## v0.5.0

- [x] render node with parents
- [x] fix relative color from xyz
- [x] fix bug when inlineCss is true but no css variable exists
- [x] compute more shorthands
- [x] (web) fetch imported css files from external domains using cors

## v0.4.1

no code change

## v0.4.0

Parsing

- [x] allow async node visitors
- [x] adding declaration parsing helper async parseDeclarations(source: string): Promise<AstDeclarations[]>

CSS color level 4 & 5

- [x] color space: srgb, srgb-linear, display-p3, prophoto-rgb, a98-rgb, rec2020, xyz, xyz-d50
- [x] color-mix()
- [x] color()
- [x] relative color
- [x] lab()
- [x] lch()
- [x] oklab()
- [x] oklch()

## v0.3.0

### shorthands

- [x] column-rule
- [x] columns
- [x] container
- [x] flex
- [x] flex-flow
- [x] gap

### Other

- [x] renamed RenderOptions.colorConvert to RenderOptions.convertColor
- [x] support none keyword in color
- [x] css relative color syntax for rgb(), hsl() and hwb() colors https://www.w3.org/TR/css-color-5/#relative-colors
    - [x] rgb
    - [x] hex
    - [x] hsl
    - [x] hwb
    - [x] calc()
    - [x] calc() and inline var()

## v0.2.0

- [x] cancellable parser promise using abortSignal
- [x] node visitor (callback) :
    - [x] Declaration visitor
    - [x] selector visitor
    - [x] at-rule visitor
- [x] support mixing units with calc()

### shorthands

- [x] transition
- [x] list-style
- [x] text-emphasis
- [x] animation

### Minification

- [x] parsing column combinator
- [x] css selector level 4 attribute modifiers
- [x] selector-4 parsing https://www.w3.org/TR/selectors-4/

## v0.1.0

- [x] sourcemap generation
- [x] reduce calc():
- [x] inline css variables
- [x] configure duplicate declarations removal
- [x] configure shorthand properties computation

## v0.0.1

### Minification

- [x] merge identical rules
- [x] merge adjacent rules
- [x] minify colors
- [x] minify numbers and Dimensions tokens
- [x] compute shorthand: see the list below
- [x] remove redundant declarations
- [x] simple shorthand properties (padding, margin, etc). must have all required properties
- [x] complex shorthand properties (background, font, etc.). may have optional properties
- [x] conditionally unwrap :is()
- [x] automatic css nesting
- [x] automatically wrap selectors using :is()
- [x] multi-level shorthand properties (
  border - [border-width, border-color, border-style, etc.]) https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties
- [x] avoid reparsing (declarations, selectors, at-rule)
- [x] node and browser versions
- [x] decode and replace utf-8 escape sequence

### Computed shorthands

- [x] background
- [x] border
- [x] border-bottom
- [x] border-color
- [x] border-left
- [x] border-radius
- [x] border-right
- [x] border-style
- [x] border-top
- [x] border-width
- [x] font
- [x] inset
- [x] margin
- [x] outline
- [x] overflow
- [x] padding
- [x] text-decoration

### Performance

- [x] flatten @import

### Error handling

- [x] parse bad comments / cdo comments
- [x] parse bad string 1
- [x] parse bad string 2
- [x] parse empty declaration
- [x] parse unclosed rule
- [x] parse unclosed at-rule
- [x] parse bad import

# Testing

- [x] node tests
- [x] browser tests

# Code Coverage

- [x] node
- [x] browser
