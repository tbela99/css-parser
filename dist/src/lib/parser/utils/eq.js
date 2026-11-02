/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { nodeSignature } from './hash.js';

/**
 *
 * @param a
 * @param b
 * @returns
 */
function eq(a, b) {
    if (a == null || b == null) {
        return a == b;
    }
    if (typeof a != "object" || typeof b != "object") {
        return a === b;
    }
    if (a.constructor != b.constructor) {
        return false;
    }
    if (Array.isArray(a)) {
        if (a.length != b.length) {
            return false;
        }
        let i = 0;
        for (; i < a.length; i++) {
            if (!eq(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }
    const k1 = Object.keys(a);
    const k2 = Object.keys(b);
    if (k1.length != k2.length) {
        return false;
    }
    let key;
    for (key of k1) {
        if (!(key in b) || !eq(a[key], b[key])) {
            return false;
        }
    }
    return true;
}
/**
 * structural equality of two tokens (source location is ignored)
 * @param arena
 * @param a
 * @param b
 */
function eqToken(arena, a, b) {
    return a == b || nodeSignature(arena, a) == nodeSignature(arena, b);
}

export { eq, eqToken };
