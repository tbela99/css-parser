/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0
	License: MIT
 */
import { minifyNumber } from '../../syntax/syntax.js';
import { EnumToken } from '../types.js';

function gcd(x, y) {
    x = Math.abs(x);
    y = Math.abs(y);
    if (x == y) {
        return x;
    }
    let t;
    if (y > x) {
        [x, y] = [y, x];
    }
    while (y) {
        t = y;
        y = x % y;
        x = t;
    }
    return x;
}
/**
 * compute an arithmetic operation. fractions are returned when shorter than the decimal value
 * @param a
 * @param b
 * @param op
 */
function compute(a, b, op) {
    if (typeof a == "number" && typeof b == "number") {
        switch (op) {
            case EnumToken.Add:
                return a + b;
            case EnumToken.Sub:
                return a - b;
            case EnumToken.Mul:
                return a * b;
            case EnumToken.Div:
                const r = simplify(a, b);
                if (r[1] == 1) {
                    return r[0];
                }
                const result = a / b;
                const r2 = minifyNumber(r[0]) + "/" + minifyNumber(r[1]);
                return minifyNumber(result).length < r2.length ? result : [r[0], r[1]];
        }
    }
    const l1 = typeof a == "number" ? [a, 1] : a;
    const r1 = typeof b == "number" ? [b, 1] : b;
    let l2;
    let r2;
    switch (op) {
        case EnumToken.Add:
            l2 = l1[0] * r1[1] + l1[1] * r1[0];
            r2 = l1[1] * r1[1];
            break;
        case EnumToken.Sub:
            l2 = l1[0] * r1[1] - l1[1] * r1[0];
            r2 = l1[1] * r1[1];
            break;
        case EnumToken.Mul:
            l2 = l1[0] * r1[0];
            r2 = l1[1] * r1[1];
            break;
        case EnumToken.Div:
            l2 = l1[0] * r1[1];
            r2 = l1[1] * r1[0];
            break;
    }
    // @ts-ignore
    const a2 = simplify(l2, r2);
    if (a2[1] == 1) {
        return a2[0];
    }
    const result = a2[0] / a2[1];
    return minifyNumber(result).length <= minifyNumber(a2[0]).length + 1 + minifyNumber(a2[1]).length
        ? result
        : [a2[0], a2[1]];
}
function rem(...a) {
    if (a.some((i) => !Number.isInteger(i))) {
        return a.reduce((a, b) => Math.max(a, String(b).split(".")[1]?.length ?? 0), 0);
    }
    return 0;
}
function simplify(a, b) {
    const g = gcd(a, b);
    return g > 1 ? [a / g, b / g] : [a, b];
}

export { compute, gcd, rem, simplify };
