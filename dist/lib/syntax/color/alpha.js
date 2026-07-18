import { ColorType, EnumToken } from '../../ast/types.js';
import { convertColor } from './color.js';
import { getColorComponents } from './utils/components.js';
import { makeColor } from './utils/make-color.js';
import { getColorType } from './utils/color-type.js';
import { equalsIgnoreCase } from '../../parser/utils/text.js';
import { cloneNode } from '../../ast/clone.js';
import { walkValues } from '../../ast/walk.js';
import { replaceNodeOrValue } from '../../parser/utils/token.js';
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
    if (color.kin === ColorType.DEVICE_CMYK) {
        return null;
    }
    if (color.kin === ColorType.COLOR_MIX || color.cal === "rel") {
        color = convertColor(color, getColorType(color));
        if (color == null) {
            return null;
        }
    }
    const components = getColorComponents(color);
    if (components == null) {
        return null;
    }
    if (alpha?.typ === EnumToken.IdenTokenType && equalsIgnoreCase(alpha.val, "alpha")) {
        alpha = components[3] ?? {
            typ: EnumToken.NumberTokenType,
            val: 1,
        };
    }
    else if (alpha.typ === EnumToken.MathFunctionTokenType &&
        equalsIgnoreCase(alpha.val, "calc")) {
        alpha = cloneNode(alpha, true);
        const alphaValue = components[3] ?? {
            typ: EnumToken.NumberTokenType,
            val: 1,
        };
        for (const { value, parent } of walkValues(alpha.chi, alpha)) {
            if (value.typ === EnumToken.IdenTokenType && equalsIgnoreCase(value.val, "alpha")) {
                replaceNodeOrValue(parent, value, alphaValue);
            }
        }
        const result = evaluate([alpha]);
        if (result.length == 1) {
            alpha = result[0];
        }
    }
    return makeColor(color.kin, components, alpha);
}

export { alpha };
