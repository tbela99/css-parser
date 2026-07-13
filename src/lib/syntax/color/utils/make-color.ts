import type { ColorToken, IdentToken, NumberToken, PercentageToken, Token } from "../../../../@types/index.js";
import { ColorType, EnumToken } from "../../../ast/types.ts";
import { equalsIgnoreCase } from "../../../parser/utils/text.ts";
import { getNumber, minmax } from "../color.ts";

/**
 * Create a color token
 * @param kind 
 * @param components 
 * @param alpha 
 * @returns 
 */
export function makeColor(kind: ColorType, components: Token[], alpha?: Token): ColorToken | null {
    if (components.length < 3) {
        return null;
    }

    const alphaValue =
        alpha == null
            ? 1
            : alpha.typ === EnumToken.IdenTokenType && equalsIgnoreCase((alpha as IdentToken).val, "none")
              ? 0
              : minmax(getNumber(alpha as NumberToken | PercentageToken | IdentToken), 0, 1);

    components.length = 3;

    if (alphaValue !== 1) {
        components.push({ typ: EnumToken.NumberTokenType, val: alphaValue });
    }

    if (kind === ColorType.LIT || kind === ColorType.HEX) {
        const val =
            "#" +
            components.reduce((acc, token, index) => {
                let value = getNumber(token as NumberToken | PercentageToken | IdentToken);

                if (index === 3) {
                    value *= 255;
                }
                return acc + Math.round(value).toString(16).padStart(2, "0");
            }, "");

        return {
            typ: EnumToken.ColorTokenType,
            val,
            kin: ColorType.HEX,
        } as ColorToken;
    }

    const hasAlpha = components.length === 4;

    let i: number = components.length;

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
