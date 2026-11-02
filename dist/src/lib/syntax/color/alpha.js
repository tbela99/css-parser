/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { ColorType, EnumToken } from '../../ast/types.js';
import { convertColor } from './color.js';
import { getColorComponents } from './utils/components.js';
import { makeColor } from './utils/make-color.js';
import { getColorType } from './utils/color-type.js';
import { equalsIgnoreCase } from '../../parser/utils/text.js';
import { walkValues } from '../../ast/walk.js';
import { evaluate } from '../../ast/math/expression.js';

/**
 * Compute alpha color
 * @param color
 * @param alpha
 * @returns
 */
function alpha(arena, color, alpha) {
    if (alpha == null) {
        return color;
    }
    // https://www.w3.org/TR/css-color-5/#:~:text=There%20is%20no%20relative%20device%2Dcmyk%28%29%20syntax
    if (arena.colorType[color] === ColorType.DEVICE_CMYK) {
        return null;
    }
    let components = getColorComponents(arena, color);
    if (arena.dataTypes[alpha] === EnumToken.MathFunctionTokenType) {
        for (const { value } of walkValues(arena, arena.tokens(alpha), alpha)) {
            if (arena.dataTypes[value] === EnumToken.IdenTokenType) {
                if (equalsIgnoreCase(arena.strings[arena.stringValue[value]], "alpha")) {
                    // replace the identifier with the alpha value
                    if (components?.[3]) {
                        arena.copyToken(value, components[3]);
                    }
                    else {
                        arena.resetToken(value, EnumToken.NumberTokenType, 1);
                    }
                    // continue;
                }
                // else if (equalsIgnoreCase(arena.strings[arena.stringValue[value]], "none")) {
                //     Object.assign(value, {
                //         typ: EnumToken.NumberTokenType,
                //         val: 0,
                //     });
                // }
            }
        }
        const result = evaluate(arena, [alpha]);
        if (result.length == 1) {
            alpha = result[0];
        }
        // else {
        //     // @ts-expect-error
        //     alpha = originalAlpha;
        // }
    }
    // console.error({ alpha });
    if (arena.dataTypes[alpha] !== EnumToken.IdenTokenType &&
        arena.dataTypes[alpha] !== EnumToken.NumberTokenType &&
        arena.dataTypes[alpha] !== EnumToken.PercentageTokenType) {
        return null;
    }
    if (arena.dataTypes[alpha] === EnumToken.IdenTokenType) {
        if (equalsIgnoreCase(arena.strings[arena.stringValue[alpha]], "NaN") ||
            equalsIgnoreCase(arena.strings[arena.stringValue[alpha]], "Infinity") ||
            equalsIgnoreCase(arena.strings[arena.stringValue[alpha]], "-Infinity")) {
            return null;
        }
    }
    if (arena.colorType[color] === ColorType.COLOR_MIX || arena.strings[arena.unit[color]] === "rel") {
        const converted = convertColor(arena, color, getColorType(arena, color));
        if (converted == null) {
            return null;
        }
        color = converted;
        components = getColorComponents(arena, color);
    }
    if (components == null) {
        return null;
    }
    if (arena.dataTypes[alpha] === EnumToken.IdenTokenType) {
        // if (equalsIgnoreCase(arena.strings[arena.stringValue[alpha]], "alpha")) {
        //     alpha = components[3] ?? {
        //         typ: EnumToken.NumberTokenType,
        //         val: 1,
        //     };
        // } else
        if (equalsIgnoreCase(arena.strings[arena.stringValue[alpha]], "none")) {
            arena.resetToken(alpha, EnumToken.NumberTokenType, 0);
        }
    }
    return makeColor(arena, arena.colorType[color], components, alpha);
}

export { alpha };
