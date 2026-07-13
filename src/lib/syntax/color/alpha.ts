import type { ColorToken, FunctionToken, IdentToken, Token } from "../../../@types/index.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import { convertColor } from "./color.ts";
import { getColorComponents } from "./utils/components.ts";
import { makeColor } from "./utils/make-color.ts";
import { getColorType } from "./utils/color-type.ts";
import { equalsIgnoreCase } from "../../parser/utils/text.ts";
import { cloneNode } from "../../ast/clone.ts";
import { walkValues } from "../../ast/walk.ts";
import { replaceNodeOrValue } from "../../parser/utils/token.ts";
import { evaluate } from "../../ast/math/expression.ts";

/**
 * Compute alpha color
 * @param color
 * @param alpha
 * @returns
 */
export function alpha(color: ColorToken, alpha?: Token): ColorToken | null {
    if (alpha == null) {
        return color;
    }

    if (color.kin === ColorType.DEVICE_CMYK) {
        return null;
    }

    if (alpha == null) {
        return color;
    }

    if (color.kin === ColorType.COLOR_MIX || color.cal === "rel") {
        color = convertColor(color, getColorType(color) as ColorType) as ColorToken;

        if (color == null) {
            return null;
        }
    }

    const components = getColorComponents(color);

    if (components == null) {
        return null;
    }

    if (alpha.typ === EnumToken.IdenTokenType && equalsIgnoreCase((alpha as IdentToken).val, "alpha")) {
        alpha = components[3] ?? {
            typ: EnumToken.NumberTokenType,
            val: 1,
        };
    } else if (
        alpha.typ === EnumToken.MathFunctionTokenType &&
        equalsIgnoreCase((alpha as FunctionToken).val, "calc")
    ) {
        alpha = cloneNode(alpha, true);

        const alphaValue = components[3] ?? {
            typ: EnumToken.NumberTokenType,
            val: 1,
        };

        for (const { value, parent } of walkValues((alpha as FunctionToken).chi, alpha)) {
            if (value.typ === EnumToken.IdenTokenType && equalsIgnoreCase((value as IdentToken).val, "alpha")) {
                replaceNodeOrValue(parent, value, alphaValue);
            }
        }

        const result = evaluate([alpha as FunctionToken]);

        if (result.length == 1) {
            alpha = result[0];
        }
    }

    return makeColor(color.kin, components, alpha);
}
