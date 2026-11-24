/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.1
	License: MIT
 */
/**
 * Hashing and comparison of strings and of ranges of code units, without creating strings.
 *
 * The tokenizer reads the code units of the css source (see `toCodeUnits()`): the values of the tokens are ranges of
 * the code units. The tables of the tokenizer and the string table of the arena are keyed by the hash of the code units:
 * a string and a range of code units with the same content have the same hash. When the hashes are equal, the code
 * units are compared: the hash is 30 bits, different strings may have the same hash.
 *
 * @module
 * @internal
 */
/**
 * FNV-1a offset basis
 */
const FNV_OFFSET = 0x811c9dc5 | 0;
/**
 * FNV-1a prime
 */
const FNV_PRIME = 0x01000193;
/**
 * the hashes are 30 bits integers: small integers are not boxed
 */
const HASH_MASK = 0x3fffffff;
/**
 * KELVIN SIGN: the only code unit, other than the ascii uppercase letters, lowercased to an ascii letter by
 * `toLowerCase()` (`k`)
 */
const KELVIN_SIGN = 0x212a;
/**
 * hash of a string (case sensitive). same value as {@link hashRange} for the same code units
 * @param str
 */
function hashString(str) {
    let hash = FNV_OFFSET;
    for (let i = 0; i < str.length; i++) {
        hash = Math.imul(hash ^ str.charCodeAt(i), FNV_PRIME);
    }
    return hash & HASH_MASK;
}
/**
 * hash of a range of code units (case sensitive). same value as {@link hashString} for the same code units
 * @param codes
 * @param start
 * @param end
 */
function hashRange(codes, start, end) {
    let hash = FNV_OFFSET;
    for (let i = start; i < end; i++) {
        hash = Math.imul(hash ^ codes[i], FNV_PRIME);
    }
    return hash & HASH_MASK;
}
/**
 * lowercase ascii code of a code unit, like `toLowerCase()` for the keys of the tokenizer tables: the ascii uppercase
 * letters and the kelvin sign are lowercased. -1 for the other non ascii code units: they do not match an ascii key
 * @param code
 */
function lowerAscii(code) {
    if (code >= 0x41 && code <= 0x5a) {
        return code + 32;
    }
    if (code > 0x7f) {
        return code === KELVIN_SIGN ? 0x6b : -1;
    }
    return code;
}
/**
 * hash of a range of code units, ignoring the case (see {@link lowerAscii}). -1 when the range contains a non ascii
 * character that cannot match an ascii key
 * @param codes
 * @param start
 * @param end
 */
function hashRangeLower(codes, start, end) {
    let hash = FNV_OFFSET;
    for (let i = start; i < end; i++) {
        const code = lowerAscii(codes[i]);
        if (code === -1) {
            return -1;
        }
        hash = Math.imul(hash ^ code, FNV_PRIME);
    }
    return hash & HASH_MASK;
}

export { hashRange, hashRangeLower, hashString, lowerAscii };
