# Changelog

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