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
 * register a canonical string
 * @param str
 * @returns the range of the string in the canonical text, packed: `start << 8 | length` (see {@link canonicalStart}
 * and {@link canonicalEnd})
 */
export declare function registerCanonical(str: string): number;
/**
 * start of a packed range
 * @param range
 */
export declare function canonicalStart(range: number): number;
/**
 * end of a packed range
 * @param range
 */
export declare function canonicalEnd(range: number): number;
/**
 * the canonical text
 */
export declare function canonicalText(): string;
/**
 * the code units of the canonical text
 */
export declare function canonicalCodes(): Uint16Array;
