import { EnumToken, ColorType } from '../../ast/types.js';
import { convertColor } from './color.js';
import { getColorComponents } from './utils/components.js';
import { makeColor } from './utils/make-color.js';
import { getColorType } from './utils/color-type.js';
import { equalsIgnoreCase } from '../../parser/utils/text.js';
import { cloneNode } from '../../ast/clone.js';
import { walkValues } from '../../ast/walk.js';
import { evaluate } from '../../ast/math/expression.js';

/**
 * Compute alpha color
 * @param color
 * @param alpha
 * @returns
 */
function alpha(color, alpha) {
    if (alpha == null) {
        return color;
    }
    let components = getColorComponents(color);
    if (alpha.typ === EnumToken.MathFunctionTokenType) {
        const originalAlpha = cloneNode(alpha, true);
        for (const { value } of walkValues(alpha.chi, alpha)) {
            if (value.typ === EnumToken.IdenTokenType) {
                if (equalsIgnoreCase(value.val, "alpha")) {
                    Object.assign(value, components?.[3]
                        ? cloneNode(components[3], true)
                        : {
                            typ: EnumToken.NumberTokenType,
                            val: 1,
                        });
                    // continue;
                }
                else if (equalsIgnoreCase(value.val, "none")) {
                    Object.assign(value, {
                        typ: EnumToken.NumberTokenType,
                        val: 0,
                    });
                }
            }
        }
        const result = evaluate([alpha]);
        if (result.length == 1) {
            alpha = result[0];
        }
        else {
            // @ts-expect-error
            alpha = originalAlpha;
        }
    }
    if (alpha.typ !== EnumToken.IdenTokenType &&
        alpha.typ !== EnumToken.NumberTokenType &&
        alpha.typ !== EnumToken.PercentageTokenType) {
        return null;
    }
    if (color.kin === ColorType.DEVICE_CMYK) {
        return null;
    }
    if (color.kin === ColorType.COLOR_MIX || color.cal === "rel") {
        color = convertColor(color, getColorType(color));
        if (color == null) {
            return null;
        }
        components = getColorComponents(color);
    }
    if (components == null) {
        return null;
    }
    if (alpha?.typ === EnumToken.IdenTokenType) {
        if (equalsIgnoreCase(alpha.val, "alpha")) {
            alpha = components[3] ?? {
                typ: EnumToken.NumberTokenType,
                val: 1,
            };
        }
        else if (equalsIgnoreCase(alpha.val, "node")) {
            alpha = {
                typ: EnumToken.NumberTokenType,
                val: 0,
            };
        }
    }
    return makeColor(color.kin, components, alpha);
}

export { alpha };
