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
 * FNV-1a offset basis
 */
const FNV_OFFSET: number = 0x811c9dc5 | 0;

/**
 * FNV-1a prime
 */
const FNV_PRIME: number = 0x01000193;

/**
 * the hashes are 30 bits integers: small integers are not boxed
 */
const HASH_MASK: number = 0x3fffffff;

/**
 * KELVIN SIGN: the only code unit, other than the ascii uppercase letters, lowercased to an ascii letter by
 * `toLowerCase()` (`k`)
 */
const KELVIN_SIGN: number = 0x212a;

/**
 * hash of a string (case sensitive). same value as {@link hashRange} for the same code units
 * @param str
 */
export function hashString(str: string): number {
    let hash: number = FNV_OFFSET;

    for (let i: number = 0; i < str.length; i++) {
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
export function hashRange(codes: CodeUnits, start: number, end: number): number {
    let hash: number = FNV_OFFSET;

    for (let i: number = start; i < end; i++) {
        hash = Math.imul(hash ^ codes[i], FNV_PRIME);
    }

    return hash & HASH_MASK;
}

/**
 * lowercase ascii code of a code unit, like `toLowerCase()` for the keys of the tokenizer tables: the ascii uppercase
 * letters and the kelvin sign are lowercased. -1 for the other non ascii code units: they do not match an ascii key
 * @param code
 */
export function lowerAscii(code: number): number {
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
export function hashRangeLower(codes: ArrayLike<number>, start: number, end: number): number {
    let hash: number = FNV_OFFSET;

    for (let i: number = start; i < end; i++) {
        const code: number = lowerAscii(codes[i]);

        if (code === -1) {
            return -1;
        }

        hash = Math.imul(hash ^ code, FNV_PRIME);
    }

    return hash & HASH_MASK;
}

/**
 * code units of a short string, see {@link fromCodes}
 */
const shortCodes: number[] = [];

/**
 * string of a range of code units
 * @param codes
 * @param start
 * @param end
 */
export function fromCodes(codes: CodeUnits, start: number, end: number): string {
    const length: number = end - start;

    // a short string: the code units are copied to an array, a subarray is slower to create
    if (length <= 256) {
        shortCodes.length = length;

        for (let i: number = 0; i < length; i++) {
            shortCodes[i] = codes[start + i];
        }

        return String.fromCharCode.apply(null, shortCodes);
    }

    let result: string = "";

    // String.fromCharCode() with a limited number of arguments
    while (start < end) {
        const next: number = end - start > 4096 ? start + 4096 : end;

        result += String.fromCharCode.apply(null, codes.subarray(start, next) as unknown as number[]);
        start = next;
    }

    return result;
}
