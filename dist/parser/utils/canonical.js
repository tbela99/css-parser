/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.2
	License: MIT
 */
/**
 * Canonical strings: the spellings of the known units and function names (`dB`, `translateX`, ...).
 *
 * The canonical strings are registered once, when the tables of the tokenizer are built: they are stored in a single
 * text. A canonical string is a range of this text: the string table of the arena references the range
 * (see `StringSource.Canonical`), no string is created when a token is interned with its canonical spelling.
 *
 * @module
 * @internal
 */
/**
 * offset of the registered strings in {@link text}
 */
const offsets = new Map();
/**
 * registered strings, concatenated
 */
let text = "";
/**
 * code units of {@link text}
 */
let codes = new Uint16Array(0);
/**
 * register a canonical string
 * @param str
 * @returns the range of the string in the canonical text, packed: `start << 8 | length` (see {@link canonicalStart}
 * and {@link canonicalEnd})
 */
function registerCanonical(str) {
    let start = offsets.get(str);
    if (start === undefined) {
        start = text.length;
        offsets.set(str, start);
        text += str;
    }
    return (start << 8) | str.length;
}
/**
 * start of a packed range
 * @param range
 */
function canonicalStart(range) {
    return range >>> 8;
}
/**
 * end of a packed range
 * @param range
 */
function canonicalEnd(range) {
    return (range >>> 8) + (range & 0xff);
}
/**
 * the canonical text
 */
function canonicalText() {
    return text;
}
/**
 * the code units of the canonical text
 */
function canonicalCodes() {
    if (codes.length !== text.length) {
        codes = new Uint16Array(text.length);
        for (let i = 0; i < text.length; i++) {
            codes[i] = text.charCodeAt(i);
        }
    }
    return codes;
}

export { canonicalCodes, canonicalEnd, canonicalStart, canonicalText, registerCanonical };
