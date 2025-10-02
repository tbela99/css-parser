// Alphabet: a-z, A-Z, 0-9, _, -
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const FULL_ALPHABET = (LOWER + DIGITS).split(""); // 64 chars
const FIRST_ALPHABET = (LOWER).split(""); // 54 chars (no digits)
/**
 * supported hash algorithms
 */
const hashAlgorithms = ['hex', 'base64', 'base64url', 'sha1', 'sha256', 'sha384', 'sha512'];
// simple deterministic hash → number
function hashCode(str) {
    let hash = 0;
    let l = str.length;
    let i = 0;
    while (i < l) {
        hash = (hash * 31 + str.charCodeAt(i++)) >>> 0;
    }
    return hash;
}
/**
 * generate a hash id
 * @param input
 * @param length
 */
function hashId(input, length = 6) {
    let n = hashCode(input);
    const chars = [];
    // First character: must not be a digit
    chars.push(FIRST_ALPHABET[n % FIRST_ALPHABET.length]);
    // Remaining characters
    for (let i = 1; i < length; i++) {
        n = (n + chars.length + i) % FULL_ALPHABET.length;
        chars.push(FULL_ALPHABET[n]);
    }
    return chars.join("");
}
/**
 * convert input to hex
 * @param input
 */
function toHex(input) {
    let result = '';
    if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
        for (const byte of Array.from(new Uint8Array(input))) {
            result += byte.toString(16).padStart(2, '0');
        }
    }
    else {
        for (const char of String(input)) {
            result += char.charCodeAt(0).toString(16).padStart(2, '0');
        }
    }
    return result;
}
/**
 * generate a hash
 * @param input
 * @param length
 * @param algo
 */
async function hash(input, length = 6, algo) {
    let result;
    if (algo != null) {
        switch (algo) {
            case 'hex':
                return toHex(input).slice(0, length);
            case 'base64':
            case 'base64url':
                result = btoa(input);
                if (algo == 'base64url') {
                    result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                }
                return result.slice(0, length);
            case 'sha1':
            case 'sha256':
            case 'sha384':
            case 'sha512':
                return toHex(await crypto.subtle.digest(algo.replace('sha', 'SHA-'), new TextEncoder().encode(input))).slice(0, length);
            default:
                throw new Error(`Unsupported hash algorithm: ${algo}`);
        }
    }
    return hashId(input, length);
}

export { hash, hashAlgorithms, hashId };
