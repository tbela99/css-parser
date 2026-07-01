import type { ColorToken } from "../../../../@types/index.d.ts";
import { convertColor } from "../color.ts";
import { getOKLABComponents } from "../oklab.ts";
import { ColorType } from "../../../ast/types.ts";
import { colorDistancePrecision } from "../../constants.ts";

/**
 * Calculate the distance between two okLab colors.
 * @param okLab1
 * @param okLab2
 *
 * @private
 * {@link https://drafts.csswg.org/css-color-4/#comparing-color-values}
 */
export function okLabDistance(color1: ColorToken, color2: ColorToken): number | null {
    color1 = convertColor(color1, ColorType.OKLAB) as ColorToken;
    color2 = convertColor(color2, ColorType.OKLAB) as ColorToken;

    if (color1 == null || color2 == null) {
        return null;
    }

    const okLab1: [number, number, number] = getOKLABComponents(color1) as [number, number, number];
    const okLab2: [number, number, number] = getOKLABComponents(color2) as [number, number, number];

    if (okLab1 == null || okLab2 == null) {
        return null;
    }

    return Math.hypot(okLab1[0] - okLab2[0], okLab1[1] - okLab2[1], okLab1[2] - okLab2[2]);
}

/**
 * Check if two colors are close in okLab space.
 * @param color1
 * @param color2
 * @param threshold
 *
 * @private
 */
export function isOkLabClose(
    color1: ColorToken,
    color2: ColorToken,
    threshold: number = colorDistancePrecision,
): boolean {
    color1 = convertColor(color1, ColorType.OKLAB) as ColorToken;
    color2 = convertColor(color2, ColorType.OKLAB) as ColorToken;

    if (color1 == null || color2 == null) {
        return false;
    }

    const okLab1: [number, number, number] = getOKLABComponents(color1) as [number, number, number];
    const okLab2: [number, number, number] = getOKLABComponents(color2) as [number, number, number];

    for (let i = 0; i < 3; i++) {
        if (Math.abs(okLab1[i] - okLab2[i]) > threshold) {
            return false;
        }
    }

    return true;
}
