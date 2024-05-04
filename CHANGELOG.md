# Changelog

## V0.5.1
- [x] failed to flatten @import when using url() syntax
- 
## V0.5.0
- [x] render node with parents
- [x] fix relative color from xyz
- [x] fix bug when inlineCss is true bug no css variable exists
- [x] compute more shorthands
- [x] (web) fetch imported css files from external domains using cors

## V0.4.1

no code change

## V0.4.0

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

## V0.3.0

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
- [x] multi-level shorthand properties (border - [border-width, border-color, border-style, etc.]) https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties
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
