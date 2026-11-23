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
 * code units of the css source: the bytes of an ascii input, the utf-16 code units otherwise
 */
export type CodeUnits = Uint8Array | Uint16Array;
/**
 * hash of a string (case sensitive). same value as {@link hashRange} for the same code units
 * @param str
 */
export declare function hashString(str: string): number;
/**
 * hash of a range of code units (case sensitive). same value as {@link hashString} for the same code units
 * @param codes
 * @param start
 * @param end
 */
export declare function hashRange(codes: CodeUnits, start: number, end: number): number;
/**
 * lowercase ascii code of a code unit, like `toLowerCase()` for the keys of the tokenizer tables: the ascii uppercase
 * letters and the kelvin sign are lowercased. -1 for the other non ascii code units: they do not match an ascii key
 * @param code
 */
export declare function lowerAscii(code: number): number;
/**
 * hash of a range of code units, ignoring the case (see {@link lowerAscii}). -1 when the range contains a non ascii
 * character that cannot match an ascii key
 * @param codes
 * @param start
 * @param end
 */
export declare function hashRangeLower(codes: ArrayLike<number>, start: number, end: number): number;
