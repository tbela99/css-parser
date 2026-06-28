import type { ColorToken, IdentToken } from "../../../../@types/index.js";
import { ColorType } from "../../../ast/types.ts";

/**
 * Return the color type of the color components
 */
export function getColorType(color: ColorToken): ColorType | null {
    if (color.kin === ColorType.COLOR_MIX || color.cal === "rel") {
        return color.kin === ColorType.COLOR_MIX
            ? // @ts-expect-error
              (ColorType[
                  // @ts-expect-error
                  (color.chi![2] as IdentToken)?.val?.toUpperCase?.()?.replace?.("-", "_") as ColorType
              ] as ColorType)
            : getColorType(color.chi![2] as ColorToken);
    }

    return color.kin;
}
