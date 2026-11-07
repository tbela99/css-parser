import type { Token } from "../../../../@types/index.d.ts";
import type { AstArena } from "../../../ast/arena.ts";
import { convertColor } from "../color.ts";
import { getOKLABComponents } from "../oklab.ts";
import { ColorType } from "../../../ast/types.ts";
import { colorDistancePrecision } from "../../constants.ts";
import { toPrecisionValue } from "../../syntax.ts";

/**
 * Calculate the distance between two okLab colors.
 *
 * @private
 * {@link https://drafts.csswg.org/css-color-4/#comparing-color-values}
 * @param arena
 * @param color1
 * @param color2
 */
export function okLabDistance(arena: AstArena, color1: Token, color2: Token): number | null {
    const c1: Token | null = convertColor(arena, color1, ColorType.OKLAB);
    const c2: Token | null = convertColor(arena, color2, ColorType.OKLAB);

    if (c1 == null || c2 == null) {
        return null;
    }

    const okLab1: [number, number, number, number?] = getOKLABComponents(arena, c1) as [number, number, number, number?];
    const okLab2: [number, number, number, number?] = getOKLABComponents(arena, c2) as [number, number, number, number?];

    if (okLab1 == null || okLab2 == null) {
        return null;
    }

    const diff = [okLab1[0] - okLab2[0], okLab1[1] - okLab2[1], okLab1[2] - okLab2[2]] as number[];

    // include alpha
    if (okLab1[3] != null || okLab2[3] != null) {
        diff.push((okLab1[3] ?? 1) - (okLab2[3] ?? 1));
    }

    return toPrecisionValue(Math.hypot(diff[0], diff[1], diff[2], diff[3] ?? 0));
}

/**
 * Check if two colors are close in okLab space.
 * @param arena
 * @param color1
 * @param color2
 * @param threshold
 *
 * @private
 */
export function isOkLabClose(
    arena: AstArena,
    color1: Token,
    color2: Token,
    threshold: number = colorDistancePrecision,
): boolean {
    const c1: Token | null = convertColor(arena, color1, ColorType.OKLAB);
    const c2: Token | null = convertColor(arena, color2, ColorType.OKLAB);

    if (c1 == null || c2 == null) {
        return false;
    }

    const okLab1: [number, number, number] = getOKLABComponents(arena, c1) as [number, number, number];
    const okLab2: [number, number, number] = getOKLABComponents(arena, c2) as [number, number, number];

    if (okLab1 == null || okLab2 == null) {
        return false;
    }

    for (let i = 0; i < 3; i++) {
        if (Math.abs(okLab1[i] - okLab2[i]) > threshold) {
            return false;
        }
    }

    return true;
}
