import type {FractionToken} from "../../../@types/index.d.ts";
import {EnumToken} from "../types";
import {reduceNumber} from "../../renderer";

export function gcd (x: number, y: number): number {

    x = Math.abs(x);
    y = Math.abs(y);

    let t: number;

    if (x == 0 || y == 0) {

        return 1;
    }

    while (y) {

        t = y;
        y = x % y;
        x = t;
    }

    return x;
}

export function compute(a: number | FractionToken, b: number | FractionToken, op: EnumToken.Add | EnumToken.Sub | EnumToken.Mul | EnumToken.Div): number | FractionToken {

    if (typeof a == 'number' && typeof b == 'number') {

        switch (op) {

            case EnumToken.Add:

                return a + b;

            case EnumToken.Sub:

                return a - b;

            case EnumToken.Mul:

                return a * b;

            case EnumToken.Div:

                const r: [number, number] = simplify(a, b);

                if (r[1] == 1) {

                    return r[0];
                }

                const result: number = a / b;
                const r2: string = reduceNumber(r[0]) + '/' + reduceNumber(r[1]);

                return reduceNumber(result).length <= r2.length ? result : {
                    typ: EnumToken.FractionTokenType,
                    l: {typ: EnumToken.NumberTokenType, val: reduceNumber(r[0])},
                    r: {typ: EnumToken.NumberTokenType, val: reduceNumber(r[1])}
                };
        }
    }

    let l1: FractionToken = typeof a == 'number' ? {
        typ: EnumToken.FractionTokenType,
        l: {typ: EnumToken.NumberTokenType, val: reduceNumber(a)},
        r: {typ: EnumToken.NumberTokenType, val: '1'}
    } : a;
    let r1: FractionToken = typeof b == 'number' ? {
        typ: EnumToken.FractionTokenType,
        l: {typ: EnumToken.NumberTokenType, val: reduceNumber(b)},
        r: {typ: EnumToken.NumberTokenType, val: '1'}
    } : b;

    let l2: number;
    let r2: number;

    switch (op) {

        case EnumToken.Add:

            // @ts-ignore
            l2 = l1.l.val * r1.r.val + l1.r.val * r1.l.val;
            // @ts-ignore
            r2 = l1.r.val * r1.r.val;
            break;

        case EnumToken.Sub:

            // @ts-ignore
            l2 = l1.l.val * r1.r.val - l1.r.val * r1.l.val;
            // @ts-ignore
            r2 = l1.r.val * r1.r.val;
            break;

        case EnumToken.Mul:

            // @ts-ignore
            l2 = l1.l.val * r1.l.val;
            // @ts-ignore
            r2 = l1.r.val * r1.r.val;
            break;

        case EnumToken.Div:

            // @ts-ignore
            l2 = l1.l.val * r1.r.val;
            // @ts-ignore
            r2 = l1.r.val * r1.l.val;
            break;

    }

    const a2: [number, number] = simplify(l2, r2);

    if (a2[1] == 1) {

        return a2[0];
    }

    const result: number = a2[0] / a2[1];
    return reduceNumber(result).length <= reduceNumber(a2[0]).length + 1 + reduceNumber(a2[1]).length ? result : {
        typ: EnumToken.FractionTokenType,
        l: {typ: EnumToken.NumberTokenType, val: reduceNumber(a2[0])},
        r: {typ: EnumToken.NumberTokenType, val: reduceNumber(a2[1])}
    };
}

export function simplify(a: number, b: number): [number, number] {

    const g: number = gcd(a, b);
    return g > 1 ? [a / g, b / g] : [a, b];
}
