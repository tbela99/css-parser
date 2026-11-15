import type { AstArena } from "../../ast/arena.ts";

/**
 *
 * @param a
 * @param b
 * @returns
 */
export function eq(a: any, b: any): boolean {
    if (a == null || b == null) {
        return a == b;
    }

    if (typeof a !== "object" || typeof b !== "object") {
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

    const k1: string[] = Object.keys(a);
    const k2: string[] = Object.keys(b);

    if (k1.length !== k2.length) {
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
 * structural equality of two tokens (source location is ignored): same type, name, values, tokens and children.
 * same result as comparing their {@link nodeSignature}
 * @param arena
 * @param a
 * @param b
 */
export function eqToken(arena: AstArena, a: number, b: number): boolean {
    if (a === b) {
        return true;
    }

    if (
        arena.dataTypes[a] !== arena.dataTypes[b] ||
        arena.name[a] !== arena.name[b] ||
        arena.stringValue[a] !== arena.stringValue[b] ||
        arena.unit[a] !== arena.unit[b] ||
        arena.colorType[a] !== arena.colorType[b]
    ) {
        return false;
    }

    const x: number = arena.numericValue[a];
    const y: number = arena.numericValue[b];

    // NaN values are equal
    if (x !== y && (x === x || y === y)) {
        return false;
    }

    let ta: number = arena.firstToken[a];
    let tb: number = arena.firstToken[b];

    while (ta !== 0 && tb !== 0) {
        if (!eqToken(arena, ta, tb)) {
            return false;
        }

        ta = arena.nextSibling[ta];
        tb = arena.nextSibling[tb];
    }

    if (ta !== tb) {
        return false;
    }

    ta = arena.firstChild[a];
    tb = arena.firstChild[b];

    while (ta !== 0 && tb !== 0) {
        if (!eqToken(arena, ta, tb)) {
            return false;
        }

        ta = arena.nextSibling[ta];
        tb = arena.nextSibling[tb];
    }

    return ta === tb;
}
