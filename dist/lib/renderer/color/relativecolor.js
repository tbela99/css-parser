import { convert, getNumber } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import { walkValues } from '../../ast/walk.js';
import '../../parser/parse.js';
import { reduceNumber } from '../render.js';
import { colorRange } from './utils/constants.js';
import { evaluate } from '../../ast/math/expression.js';
import '../../parser/utils/config.js';

function parseRelativeColor(relativeKeys, original, rExp, gExp, bExp, aExp) {
    let r;
    let g;
    let b;
    let alpha = null;
    let keys = {};
    let values = {};
    // colorFuncColorSpace x,y,z or r,g,b
    const names = relativeKeys.startsWith('xyz') ? 'xyz' : relativeKeys.slice(-3);
    // @ts-ignore
    const converted = convert(original, relativeKeys);
    if (converted == null) {
        return null;
    }
    const children = converted.chi.filter(t => ![EnumToken.WhitespaceTokenType, EnumToken.LiteralTokenType, EnumToken.CommentTokenType].includes(t.typ));
    [r, g, b, alpha] = converted.kin == 'color' ? children.slice(1) : children;
    values = {
        [names[0]]: getValue(r, converted, names[0]),
        [names[1]]: getValue(g, converted, names[1]), // string,
        [names[2]]: getValue(b, converted, names[2]),
        // @ts-ignore
        alpha: alpha == null || (alpha.typ == EnumToken.IdenTokenType && alpha.val == 'none') ? {
            typ: EnumToken.NumberTokenType,
            val: '1'
        } : (alpha.typ == EnumToken.PercentageTokenType ? {
            typ: EnumToken.NumberTokenType,
            val: String(getNumber(alpha))
        } : alpha)
    };
    keys = {
        [names[0]]: getValue(rExp, converted, names[0]),
        [names[1]]: getValue(gExp, converted, names[1]),
        [names[2]]: getValue(bExp, converted, names[2]),
        // @ts-ignore
        alpha: getValue(aExp == null || (aExp.typ == EnumToken.IdenTokenType && aExp.val == 'none') ? {
            typ: EnumToken.NumberTokenType,
            val: '1'
        } : aExp)
    };
    return computeComponentValue(keys, values);
}
function getValue(t, converted, component) {
    if (t == null) {
        return t;
    }
    if (t.typ == EnumToken.PercentageTokenType) {
        let value = getNumber(t);
        if (converted.kin in colorRange) {
            // @ts-ignore
            value *= colorRange[converted.kin][component].at(-1);
        }
        return {
            typ: EnumToken.NumberTokenType,
            val: String(value)
        };
    }
    return t;
}
function computeComponentValue(expr, values) {
    for (const object of [values, expr]) {
        if ('h' in object) {
            // normalize hue
            // @ts-ignore
            for (const k of walkValues([object.h])) {
                if (k.value.typ == EnumToken.AngleTokenType && k.value.unit == 'deg') {
                    // @ts-ignore
                    k.value.typ = EnumToken.NumberTokenType;
                    // @ts-ignore
                    delete k.value.unit;
                }
            }
        }
    }
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
