import type { ColorToken, FunctionToken, IdentToken, Token } from "../../../@types/index.d.ts";
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
export function alpha(color: ColorToken, alpha: Token): ColorToken | null {
    if (alpha == null) {
        return color;
    }

    let components = getColorComponents(color);

    if (alpha.typ === EnumToken.MathFunctionTokenType) {
        const originalAlpha = cloneNode(alpha, true);

        for (const { value } of walkValues((alpha as FunctionToken).chi, alpha)) {
            if (value.typ === EnumToken.IdenTokenType) {
                if (equalsIgnoreCase((value as IdentToken).val, "alpha")) {
                    Object.assign(
                        value,
                        components?.[3]
                            ? cloneNode(components[3], true)
                            : {
                                  typ: EnumToken.NumberTokenType,
                                  val: 1,
                              },
                    );
                    // continue;
                } else if (equalsIgnoreCase((value as IdentToken).val, "none")) {
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
        } else {
            // @ts-expect-error
            alpha = originalAlpha;
        }
    }

    if (
        alpha.typ !== EnumToken.IdenTokenType &&
        alpha.typ !== EnumToken.NumberTokenType &&
        alpha.typ !== EnumToken.PercentageTokenType
    ) {
        return null;
    }

    if (color.kin === ColorType.DEVICE_CMYK) {
        return null;
    }

    if (color.kin === ColorType.COLOR_MIX || color.cal === "rel") {
        color = convertColor(color, getColorType(color) as ColorType) as ColorToken;

        if (color == null) {
            return null;
        }

        components = getColorComponents(color);
    }

    if (components == null) {
        return null;
    }

    if (alpha?.typ === EnumToken.IdenTokenType) {
        if (equalsIgnoreCase((alpha as IdentToken).val, "alpha")) {
            alpha = components[3] ?? {
                typ: EnumToken.NumberTokenType,
                val: 1,
            };
        } else if (equalsIgnoreCase((alpha as IdentToken).val, "node")) {
            alpha = {
                typ: EnumToken.NumberTokenType,
                val: 0,
            };
        }
    }
    
    return makeColor(color.kin, components, alpha);
}
