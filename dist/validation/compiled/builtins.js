/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.1
	License: MIT
 */
/**
 * the types validated by the code of matchProperty() (src/validation/match.ts), before their definition (if any): the
 * compiled matchers call matchProperty() for them (see leaf() in ./runtime.ts). the other types are compiled from
 * their definition. keep in sync with the switch of matchProperty() and with its calc() types
 */
/**
 * the built in types that read the whitespace or the tokens after the value being matched: the compiled matchers
 * skip the whitespace, the interpreter validates the values of these types
 */
const rawTypes = new Set([
    "type-selector",
    "compound-selector",
    "complex-selector",
    "subclass-selector",
    "attribute-selector",
    "complex-selector-unit",
    "pseudo-compound-selector",
    "forgiving-relative-selector-list",
    "complex-selector-list",
    "size-feature",
    "style-feature",
    "css-type",
]);

export { rawTypes };
