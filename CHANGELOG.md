# Changelog

## v1.1.0

- [x] inline sourcemap
- [ ] validation using mdn-data

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
- [x] fix bug when inlineCss is true bug no css variable exists
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
