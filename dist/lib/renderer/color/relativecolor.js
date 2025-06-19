import { convert, getNumber } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import { walkValues } from '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { mathFuncs } from '../../syntax/syntax.js';
import { reduceNumber } from '../render.js';
import { ColorKind, colorRange } from './utils/constants.js';
import { evaluateFunc, evaluate } from '../../ast/math/expression.js';

function parseRelativeColor(relativeKeys, original, rExp, gExp, bExp, aExp) {
    let r;
    let g;
    let b;
    let alpha = null;
    let keys = {};
    let values = {};
    // colorFuncColorSpace x,y,z or r,g,b
    const names = relativeKeys.startsWith('xyz') ? 'xyz' : relativeKeys.slice(-3);
    const converted = convert(original, ColorKind[relativeKeys.toUpperCase().replaceAll('-', '_')]);
    if (converted == null) {
        return null;
    }
    const children = converted.chi.filter(t => ![EnumToken.WhitespaceTokenType, EnumToken.LiteralTokenType, EnumToken.CommentTokenType].includes(t.typ));
    [r, g, b, alpha] = converted.kin == ColorKind.COLOR ? children.slice(1) : children;
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
    return computeComponentValue(keys, converted, values);
}
function getValue(t, converted, component) {
    if (t == null) {
        return t;
    }
    if (t.typ == EnumToken.PercentageTokenType) {
        let value = getNumber(t);
        let colorSpace = ColorKind[converted.kin].toLowerCase().replaceAll('-', '_');
        if (colorSpace in colorRange) {
            // @ts-ignore
            value *= colorRange[colorSpace][component].at(-1);
        }
        return {
            typ: EnumToken.NumberTokenType,
            val: String(value)
        };
    }
    return t;
}
function computeComponentValue(expr, converted, values) {
    for (const object of [values, expr]) {
        if ('h' in object) {
            // normalize hue
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
        else if (exp.typ == EnumToken.FunctionTokenType && mathFuncs.includes(exp.val)) {
            for (let { value, parent } of walkValues(exp.chi, exp)) {
                if (parent == null) {
                    parent = exp;
                }
                if (value.typ == EnumToken.PercentageTokenType) {
                    replaceValue(parent, value, getValue(value, converted, key));
                }
                else if (value.typ == EnumToken.IdenTokenType) {
                    // @ts-ignore
                    if (!(value.val in values || typeof Math[value.val.toUpperCase()] == 'number')) {
                        return null;
                    }
                    // @ts-ignore
                    replaceValue(parent, value, values[value.val] ?? {
                        typ: EnumToken.NumberTokenType,
                        // @ts-ignore
                        val: '' + Math[value.val.toUpperCase()]
                        // @ts-ignore
                    });
                }
            }
            const result = exp.typ == EnumToken.FunctionTokenType && mathFuncs.includes(exp.val) && exp.val != 'calc' ? evaluateFunc(exp) : evaluate(exp.chi);
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
function replaceValue(parent, value, newValue) {
    for (const { value: val, parent: pr } of walkValues([parent])) {
        if (val.typ == value.typ && val.val == value.val) {
            if (pr.typ == EnumToken.BinaryExpressionTokenType) {
                if (pr.l == val) {
                    pr.l = newValue;
                }
                else {
                    pr.r = newValue;
                }
            }
            else {
                pr.chi.splice(pr.chi.indexOf(val), 1, newValue);
            }
        }
    }
}

export { parseRelativeColor, replaceValue };
