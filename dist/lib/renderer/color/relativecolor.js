import { convert } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import { walkValues } from '../../ast/walk.js';
import '../../parser/parse.js';
import { reduceNumber } from '../render.js';
import './utils/constants.js';
import { eq } from '../../parser/utils/eq.js';
import { evaluate } from '../../ast/math/expression.js';

function parseRelativeColor(relativeKeys, original, rExp, gExp, bExp, aExp) {
    let r;
    let g;
    let b;
    let alpha = null;
    let keys = {};
    let values = {};
    const converted = convert(original, relativeKeys);
    if (converted == null) {
        return null;
    }
    [r, g, b, alpha] = converted.chi;
    values = {
        [relativeKeys[0]]: r,
        [relativeKeys[1]]: g,
        [relativeKeys[2]]: b,
        // @ts-ignore
        alpha: alpha == null || eq(alpha, {
            typ: EnumToken.IdenTokenType,
            val: 'none'
        }) ? { typ: EnumToken.NumberTokenType, val: '1' } : alpha
    };
    keys = {
        [relativeKeys[0]]: rExp,
        [relativeKeys[1]]: gExp,
        [relativeKeys[2]]: bExp,
        // @ts-ignore
        alpha: aExp == null || eq(aExp, { typ: EnumToken.IdenTokenType, val: 'none' }) ? {
            typ: EnumToken.NumberTokenType,
            val: '1'
        } : aExp
    };
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
