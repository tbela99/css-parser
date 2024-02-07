import { EnumToken } from '../types.js';
import { reduceNumber } from '../../renderer/render.js';

function gcd(x, y) {
    x = Math.abs(x);
    y = Math.abs(y);
    let t;
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
function compute(a, b, op) {
    if (typeof a == 'number' && typeof b == 'number') {
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
                const r2 = reduceNumber(r[0]) + '/' + reduceNumber(r[1]);
                return reduceNumber(result).length <= r2.length ? result : {
                    typ: EnumToken.FractionTokenType,
                    l: { typ: EnumToken.NumberTokenType, val: reduceNumber(r[0]) },
                    r: { typ: EnumToken.NumberTokenType, val: reduceNumber(r[1]) }
                };
        }
    }
    let l1 = typeof a == 'number' ? {
        typ: EnumToken.FractionTokenType,
        l: { typ: EnumToken.NumberTokenType, val: reduceNumber(a) },
        r: { typ: EnumToken.NumberTokenType, val: '1' }
    } : a;
    let r1 = typeof b == 'number' ? {
        typ: EnumToken.FractionTokenType,
        l: { typ: EnumToken.NumberTokenType, val: reduceNumber(b) },
        r: { typ: EnumToken.NumberTokenType, val: '1' }
    } : b;
    let l2;
    let r2;
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
    const a2 = simplify(l2, r2);
    if (a2[1] == 1) {
        return a2[0];
    }
    const result = a2[0] / a2[1];
    return reduceNumber(result).length <= reduceNumber(a2[0]).length + 1 + reduceNumber(a2[1]).length ? result : {
        typ: EnumToken.FractionTokenType,
        l: { typ: EnumToken.NumberTokenType, val: reduceNumber(a2[0]) },
        r: { typ: EnumToken.NumberTokenType, val: reduceNumber(a2[1]) }
    };
}
function simplify(a, b) {
    const g = gcd(a, b);
    return g > 1 ? [a / g, b / g] : [a, b];
}

export { compute, gcd, simplify };
