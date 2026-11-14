import { minifyNumber } from "../../syntax/syntax.ts";
import { EnumToken } from "../types.ts";

/**
 * fraction: numerator and denominator
 */
export type Fraction = [number, number];

export function gcd(x: number, y: number): number {
    x = Math.abs(x);
    y = Math.abs(y);

    if (x === y) {
        return x;
    }

    let t: number;

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
export function compute(
    a: number | Fraction,
    b: number | Fraction,
    op: EnumToken.Add | EnumToken.Sub | EnumToken.Mul | EnumToken.Div,
): number | Fraction {
    if (typeof a === "number" && typeof b === "number") {
        switch (op) {
            case EnumToken.Add:
                return a + b;

            case EnumToken.Sub:
                return a - b;

            case EnumToken.Mul:
                return a * b;

            case EnumToken.Div:
                const r: [number, number] = simplify(a, b);

                if (r[1] === 1) {
                    return r[0];
                }

                const result: number = a / b;
                const r2: string = minifyNumber(r[0]) + "/" + minifyNumber(r[1]);

                return minifyNumber(result).length < r2.length ? result : [r[0], r[1]];
        }
    }

    const l1: Fraction = typeof a === "number" ? [a, 1] : a;
    const r1: Fraction = typeof b === "number" ? [b, 1] : b;

    let l2: number;
    let r2: number;

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
    const a2: [number, number] = simplify(l2 as number, r2 as number);

    if (a2[1] === 1) {
        return a2[0];
    }

    const result: number = a2[0] / a2[1];
    return minifyNumber(result).length <= minifyNumber(a2[0]).length + 1 + minifyNumber(a2[1]).length
        ? result
        : [a2[0], a2[1]];
}

export function rem(...a: number[]): number {
    if (a.some((i) => !Number.isInteger(i))) {
        return a.reduce((a, b) => Math.max(a, String(b).split(".")[1]?.length ?? 0), 0);
    }

    return 0;
}

export function simplify(a: number, b: number): [number, number] {
    const g: number = gcd(a, b);
    return g > 1 ? [a / g, b / g] : [a, b];
}
