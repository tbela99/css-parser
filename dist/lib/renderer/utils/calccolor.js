import { COLORS_NAMES, getNumber, getAngle } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import { walkValues } from '../../ast/walk.js';
import '../../parser/parse.js';
import { reduceNumber } from '../render.js';
import { hwb2rgb, hsl2rgb } from './rgb.js';
import { rgb2hwb, hsl2hwb } from './hwb.js';
import { rgb2hsl, hwb2hsl } from './hsl.js';
import { evaluate } from '../../ast/math/expression.js';

function parseRelativeColor(relativeKeys, original, rExp, gExp, bExp, aExp) {
    const type = relativeKeys.join('');
    let r;
    let g;
    let b;
    let alpha = null;
    let keys = {};
    let values = {};
    let children;
    switch (original.kin) {
        case 'lit':
        case 'hex':
            let value = original.val.toLowerCase();
            if (original.kin == 'lit') {
                if (original.val.toLowerCase() in COLORS_NAMES) {
                    value = COLORS_NAMES[original.val.toLowerCase()];
                }
                else {
                    return null;
                }
            }
            if (value.length == 4) {
                value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
            }
            else if (value.length == 5) {
                value = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3] + value[4] + value[4];
            }
            r = parseInt(value.slice(1, 3), 16);
            g = parseInt(value.slice(3, 5), 16);
            b = parseInt(value.slice(5, 7), 16);
            alpha = value.length == 9 ? parseInt(value.slice(7, 9), 16) : null;
            break;
        case 'rgb':
        case 'rgba':
            children = original.chi.filter((t) => t.typ == EnumToken.NumberTokenType || t.typ == EnumToken.IdenTokenType || t.typ == EnumToken.PercentageTokenType);
            if (children.every((t) => (t.typ == EnumToken.IdenTokenType && t.val == 'none') || t.typ == EnumToken.NumberTokenType)) {
                r = children[0].typ == EnumToken.IdenTokenType && children[0].val == 'none' ? 0 : +children[0].val;
                g = children[1].typ == EnumToken.IdenTokenType && children[1].val == 'none' ? 0 : +children[1].val;
                b = children[2].typ == EnumToken.IdenTokenType && children[2].val == 'none' ? 0 : +children[2].val;
                alpha = children.length < 4 ? null : children[3].typ == EnumToken.IdenTokenType && children[3].val == 'none' ? 0 : +children[3].val;
            }
            else if (children.every((t) => t.typ == EnumToken.PercentageTokenType || (t.typ == EnumToken.IdenTokenType && t.val == 'none') || (t.typ == EnumToken.NumberTokenType && t.val == '0'))) {
                // @ts-ignore
                r = children[0].typ == EnumToken.IdenTokenType && children[0].val == 'none' ? 0 : children[0].val * 255 / 100;
                // @ts-ignore
                g = children[1].typ == EnumToken.IdenTokenType && children[1].val == 'none' ? 0 : children[1].val * 255 / 100;
                // @ts-ignore
                b = children[2].typ == EnumToken.IdenTokenType && children[2].val == 'none' ? 0 : children[2].val * 255 / 100;
                alpha = children.length < 4 ? null : children[3].typ == EnumToken.IdenTokenType && children[3].val == 'none' ? 0 : +children[3].val / 100;
            }
            else {
                return null;
            }
            break;
        case 'hsl':
        case 'hsla':
        case 'hwb':
            children = original.chi.filter((t) => t.typ == EnumToken.AngleTokenType || t.typ == EnumToken.NumberTokenType || t.typ == EnumToken.IdenTokenType || t.typ == EnumToken.PercentageTokenType);
            if (children.length == 3 || children.length == 4) {
                [r, g, b, alpha] = children;
            }
            else {
                return null;
            }
            break;
        default:
            return null;
    }
    const from = ['rgb', 'rgba', 'hex', 'lit'].includes(original.kin) ? 'rgb' : original.kin;
    if (from != type) {
        if (type == 'hsl' || type == 'hwb') {
            if (from == 'rgb') {
                [r, g, b] = (type == 'hwb' ? rgb2hwb : rgb2hsl)(r, g, b);
                // @ts-ignore
                r *= 360;
                // @ts-ignore
                g *= 100;
                // @ts-ignore
                b *= 100;
                values = {
                    [relativeKeys[0]]: { typ: EnumToken.AngleTokenType, val: r, unit: 'deg' },
                    [relativeKeys[1]]: { typ: EnumToken.PercentageTokenType, val: g },
                    [relativeKeys[2]]: { typ: EnumToken.PercentageTokenType, val: b }
                };
            }
            else if (from == 'hwb' || from == 'hsl') {
                if (type == 'hsl') {
                    if (from == 'hwb') {
                        [r, g, b] = hwb2hsl(getAngle(r), getNumber(g), getNumber(b));
                        // @ts-ignore
                        r *= 360;
                        // @ts-ignore
                        g *= 100;
                        // @ts-ignore
                        b *= 100;
                        // @ts-ignore
                        values = {
                            [relativeKeys[0]]: { typ: EnumToken.AngleTokenType, val: r, unit: 'deg' },
                            [relativeKeys[1]]: { typ: EnumToken.PercentageTokenType, val: g },
                            [relativeKeys[2]]: { typ: EnumToken.PercentageTokenType, val: b }
                        };
                    }
                }
                else if (type == 'hwb') {
                    if (from == 'hsl') {
                        [r, g, b] = hsl2hwb(getAngle(r), getNumber(g), getNumber(b));
                        // @ts-ignore
                        r *= 360;
                        // @ts-ignore
                        g *= 100;
                        // @ts-ignore
                        b *= 100;
                        // @ts-ignore
                        values = {
                            [relativeKeys[0]]: { typ: EnumToken.AngleTokenType, val: r, unit: 'deg' },
                            [relativeKeys[1]]: { typ: EnumToken.PercentageTokenType, val: g },
                            [relativeKeys[2]]: { typ: EnumToken.PercentageTokenType, val: b }
                        };
                    }
                }
            }
            else {
                return null;
            }
        }
        else if (type == 'rgb') {
            if (from == 'hsl' || from == 'hwb') {
                [r, g, b] = (from == 'hwb' ? hwb2rgb : hsl2rgb)(getAngle(r), getNumber(g), getNumber(b));
                // @ts-ignore
                values = {
                    [relativeKeys[0]]: { typ: EnumToken.NumberTokenType, val: r },
                    [relativeKeys[1]]: { typ: EnumToken.NumberTokenType, val: g },
                    [relativeKeys[2]]: { typ: EnumToken.NumberTokenType, val: b }
                };
            }
            else {
                return null;
            }
        }
    }
    else {
        values = {
            [relativeKeys[0]]: r,
            [relativeKeys[1]]: g,
            [relativeKeys[2]]: b
        };
    }
    if (aExp != null && aExp.typ == EnumToken.IdenTokenType && aExp.val == 'none') {
        aExp = null;
    }
    keys = {
        [relativeKeys[0]]: rExp,
        [relativeKeys[1]]: gExp,
        [relativeKeys[2]]: bExp,
        alpha: aExp ?? { typ: EnumToken.IdenTokenType, val: 'alpha' }
    };
    // @ts-ignore
    values.alpha = alpha != null && typeof alpha == 'object' ? alpha : b.typ == EnumToken.PercentageTokenType ? { typ: EnumToken.PercentageTokenType, val: String(alpha ?? 100) } : { typ: EnumToken.NumberTokenType, val: String(alpha ?? 1) };
    return computeComponentValue(keys, values);
}
function computeComponentValue(expr, values) {
    for (const [key, exp] of Object.entries(expr)) {
        if (exp == null) {
            if (key in values) {
                if (typeof values[key] == 'number') {
                    expr[key] = {
                        typ: EnumToken.NumberTokenType,
                        val: reduceNumber(values[key])
                    };
                }
                else {
                    expr[key] = values[key];
                }
            }
        }
        else if ([EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.AngleTokenType, EnumToken.LengthTokenType].includes(exp.typ)) ;
        else if (exp.typ == EnumToken.IdenTokenType && exp.val in values) {
            if (typeof values[exp.val] == 'number') {
                expr[key] = {
                    typ: EnumToken.NumberTokenType,
                    val: reduceNumber(values[exp.val])
                };
            }
            else {
                expr[key] = values[exp.val];
            }
        }
        else if (exp.typ == EnumToken.FunctionTokenType && exp.val == 'calc') {
            for (let { value, parent } of walkValues(exp.chi)) {
                if (value.typ == EnumToken.IdenTokenType) {
                    if (!(value.val in values)) {
                        return null;
                    }
                    if (parent == null) {
                        parent = exp;
                    }
                    if (parent.typ == EnumToken.BinaryExpressionTokenType) {
                        if (parent.l == value) {
                            parent.l = values[value.val];
                        }
                        else {
                            parent.r = values[value.val];
                        }
                    }
                    else {
                        for (let i = 0; i < parent.chi.length; i++) {
                            if (parent.chi[i] == value) {
                                parent.chi.splice(i, 1, values[value.val]);
                                break;
                            }
                        }
                    }
                }
            }
            const result = evaluate(exp.chi);
            if (result.length == 1 && result[0].typ != EnumToken.BinaryExpressionTokenType) {
                expr[key] = result[0];
            }
            else {
                return null;
            }
        }
    }
    return expr;
}

export { parseRelativeColor };
