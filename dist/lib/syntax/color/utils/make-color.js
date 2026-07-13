import { EnumToken, ColorType } from '../../../ast/types.js';
import { equalsIgnoreCase } from '../../../parser/utils/text.js';
import { minmax, getNumber } from '../color.js';

/**
 * Create a color token
 * @param kind
 * @param components
 * @param alpha
 * @returns
 */
function makeColor(kind, components, alpha) {
    if (components.length < 3) {
        return null;
    }
    const alphaValue = alpha == null
        ? 1
        : alpha.typ === EnumToken.IdenTokenType && equalsIgnoreCase(alpha.val, "none")
            ? 0
            : minmax(getNumber(alpha), 0, 1);
    components.length = 3;
    if (alphaValue !== 1) {
        components.push({ typ: EnumToken.NumberTokenType, val: alphaValue });
    }
    if (kind === ColorType.LIT || kind === ColorType.HEX) {
        const val = "#" +
            components.reduce((acc, token, index) => {
                let value = getNumber(token);
                if (index === 3) {
                    value *= 255;
                }
                return acc + Math.round(value).toString(16).padStart(2, "0");
            }, "");
        return {
            typ: EnumToken.ColorTokenType,
            val,
            kin: ColorType.HEX,
        };
    }
    const hasAlpha = components.length === 4;
    let i = components.length;
    while (--i > 0) {
        components.splice(i, 0, { typ: EnumToken.WhitespaceTokenType });
    }
    if (hasAlpha) {
        components[components.length - 2] = { typ: EnumToken.LiteralTokenType, val: "/" };
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: ColorType[kind].toLowerCase(),
        chi: components,
        kin: kind,
    };
}

export { makeColor };
