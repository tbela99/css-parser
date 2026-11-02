/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { convertColor, getNumber } from './color.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import { walkValues } from '../../ast/walk.js';
import { evaluateFunc, evaluate } from '../../ast/math/expression.js';
import { colorsFunc, colorFuncColorSpace, colorRange, mathFuncs } from '../constants.js';
import { equalsIgnoreCase } from '../../parser/utils/text.js';
import { getColorComponents } from './utils/components.js';

/**
 * Parse relative color components
 * @param relativeKeys
 * @param original
 * @param rExp
 * @param gExp
 * @param bExp
 * @param aExp
 * @returns
 */
function parseRelativeColorComponents(arena, relativeKeys, original, rExp, gExp, bExp, aExp) {
    let r;
    let g;
    let b;
    let alpha = null;
    let keys = {};
    let values = {};
    // colorFuncColorSpace x,y,z or r,g,b
    const names = relativeKeys.startsWith("xyz")
        ? "xyz"
        : ["srgb", "srgb-linear", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020", "rgb"].some((t) => equalsIgnoreCase(t, relativeKeys))
            ? "rgb"
            : relativeKeys.slice(-3);
    const allComponents = aExp == null ? [rExp, gExp, bExp] : [rExp, gExp, bExp, aExp];
    const components = getColorComponents(arena, original);
    const validKeys = names.split("");
    let val = "";
    if (components != null) {
        for (const component of components) {
            allComponents.push(component);
        }
    }
    // ensure all components are valid for the color space
    for (const component of allComponents) {
        if (component == null) {
            continue;
        }
        if (arena.dataTypes[component] == EnumToken.IdenTokenType) {
            val = arena.strings[arena.stringValue[component]];
            if (
            // @ts-expect-error
            typeof Math[val.toUpperCase()] !== "number" &&
                !equalsIgnoreCase(val, "in") &&
                !equalsIgnoreCase(val, "hue") &&
                !equalsIgnoreCase(val, "from") &&
                !equalsIgnoreCase(val, "alpha") &&
                !equalsIgnoreCase(val, "none") &&
                !equalsIgnoreCase(val, "shorter") &&
                !equalsIgnoreCase(val, "longer") &&
                !equalsIgnoreCase(val, "increasing") &&
                !equalsIgnoreCase(val, "decreasing") &&
                !colorsFunc.some((t) => equalsIgnoreCase(t, val)) &&
                !colorFuncColorSpace.includes(val) &&
                !validKeys.includes(val)) {
                return null;
            }
            continue;
        }
        if (arena.dataTypes[component] === EnumToken.MathFunctionTokenType &&
            equalsIgnoreCase("calc", arena.strings[arena.stringValue[component]])) {
            for (const { value } of walkValues(arena, arena.tokens(component))) {
                if (arena.dataTypes[value] == EnumToken.IdenTokenType) {
                    val = arena.strings[arena.stringValue[value]].toLowerCase();
                    if (
                    // @ts-expect-error
                    typeof Math[val.toUpperCase()] !== "number" &&
                        val != "in" &&
                        val != "hue" &&
                        val != "from" &&
                        val != "alpha" &&
                        val != "none" &&
                        val != "shorter" &&
                        val != "longer" &&
                        val != "increasing" &&
                        val != "decreasing" &&
                        !colorsFunc.includes(val) &&
                        !colorFuncColorSpace.includes(val) &&
                        !validKeys.includes(val)) {
                        return null;
                    }
                }
            }
        }
    }
    const converted = convertColor(arena, original, ColorType[relativeKeys.toUpperCase().replaceAll("-", "_")]);
    if (converted == null) {
        return null;
    }
    const children = arena.tokens(converted).filter((t) => ![EnumToken.WhitespaceTokenType, EnumToken.LiteralTokenType, EnumToken.CommentTokenType].includes(arena.dataTypes[t]));
    [r, g, b, alpha] = arena.colorType[converted] == ColorType.COLOR ? children.slice(1) : children;
    values = {
        [names[0]]: getValue(arena, r, converted, names[0]),
        [names[1]]: getValue(arena, g, converted, names[1]), // string,
        [names[2]]: getValue(arena, b, converted, names[2]),
        // @ts-ignore
        alpha: alpha == null
            ? numberToken(arena, 1, b)
            : arena.dataTypes[alpha] == EnumToken.IdenTokenType && arena.strings[arena.stringValue[alpha]] == "none"
                ? numberToken(arena, 0, alpha)
                : arena.dataTypes[alpha] == EnumToken.PercentageTokenType
                    ? numberToken(arena, getNumber(arena, alpha), alpha)
                    : alpha,
    };
    keys = {
        [names[0]]: getValue(arena, rExp, converted, names[0]),
        [names[1]]: getValue(arena, gExp, converted, names[1]),
        [names[2]]: getValue(arena, bExp, converted, names[2]),
        // @ts-ignore
        alpha: getValue(arena, aExp == null
            ? numberToken(arena, 1, bExp)
            : arena.dataTypes[aExp] == EnumToken.IdenTokenType && arena.strings[arena.stringValue[aExp]] == "none"
                ? numberToken(arena, 0, aExp)
                : aExp),
    };
    const result = computeComponentValue(arena, keys, values);
    if (result != null) {
        if ("hsl" == relativeKeys) {
            toPercentage(arena, result.s);
            toPercentage(arena, result.l);
        }
        else if ("hwb" == relativeKeys) {
            toPercentage(arena, result.w);
            toPercentage(arena, result.b);
        }
    }
    // @ts-ignore
    if (arena.dataTypes[result?.alpha] == EnumToken.NumberTokenType && arena.numericValue[result.alpha] === 1) {
        // @ts-ignore
        const { alpha, ...components } = result;
        return components;
    }
    return result;
}
/**
 * Get token numeric value
 * @param t
 * @param converted
 * @param component
 * @returns
 */
function getValue(arena, t, converted, component) {
    if (arena.dataTypes[t] == EnumToken.PercentageTokenType) {
        let value = getNumber(arena, t);
        if (converted != null) {
            let colorSpace = ColorType[arena.colorType[converted]].toLowerCase().replaceAll("-", "_");
            if (colorSpace in colorRange) {
                // @ts-ignore
                value *= colorRange[colorSpace][component].at(-1);
            }
        }
        return numberToken(arena, value, t);
    }
    return t;
}
/**
 * Compute component value
 * @param expr
 * @param values
 * @returns
 */
function computeComponentValue(arena, expr, values) {
    for (const object of [values, expr]) {
        if ("h" in object) {
            // normalize hue
            for (const k of walkValues(arena, [object.h])) {
                if (arena.dataTypes[k.value] == EnumToken.AngleTokenType && arena.strings[arena.unit[k.value]] == "deg") {
                    arena.dataTypes[k.value] = EnumToken.NumberTokenType;
                }
            }
        }
    }
    for (const [key, exp] of Object.entries(expr)) {
        if ([
            EnumToken.NumberTokenType,
            EnumToken.PercentageTokenType,
            EnumToken.AngleTokenType,
            EnumToken.LengthTokenType,
        ].includes(arena.dataTypes[exp])) ;
        else if (arena.dataTypes[exp] == EnumToken.IdenTokenType && arena.strings[arena.stringValue[exp]] in values) {
            expr[key] = values[arena.strings[arena.stringValue[exp]]];
        }
        else if (arena.dataTypes[exp] == EnumToken.MathFunctionTokenType ||
            (arena.dataTypes[exp] == EnumToken.FunctionTokenType && mathFuncs.includes(arena.strings[arena.stringValue[exp]]))) {
            for (let { value } of walkValues(arena, arena.tokens(exp), exp)) {
                if (arena.dataTypes[value] == EnumToken.IdenTokenType) {
                    const name = arena.strings[arena.stringValue[value]];
                    const replacement = values[name];
                    // replace the identifier by its value
                    if (replacement != null) {
                        arena.copyToken(value, replacement);
                    }
                    else {
                        // @ts-ignore
                        const constant = Math[name.toUpperCase()];
                        arena.resetToken(value, EnumToken.NumberTokenType, constant);
                    }
                }
            }
            const result = (arena.dataTypes[exp] === EnumToken.MathFunctionTokenType ||
                (arena.dataTypes[exp] == EnumToken.FunctionTokenType && mathFuncs.includes(arena.strings[arena.stringValue[exp]]))) &&
                arena.strings[arena.stringValue[exp]] !== "calc"
                ? evaluateFunc(arena, exp)
                : evaluate(arena, arena.tokens(exp));
            if (result.length == 1 && arena.dataTypes[result[0]] != EnumToken.BinaryExpressionTokenType) {
                expr[key] = result[0];
            }
        }
    }
    return expr;
}
/**
 * allocate a number token with the location of another token
 * @param arena
 * @param val
 * @param location
 */
function numberToken(arena, val, location) {
    const token = arena.createToken(EnumToken.NumberTokenType, val);
    if (location != null) {
        arena.copyLocation(token, location);
    }
    return token;
}
/**
 * convert a number token to a percentage (in place)
 * @param arena
 * @param token
 */
function toPercentage(arena, token) {
    arena.numericValue[token] = getNumber(arena, token) * 100;
    arena.dataTypes[token] = EnumToken.PercentageTokenType;
}

export { parseRelativeColorComponents };
