/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0
	License: MIT
 */
import { convertColor } from '../color.js';
import { getOKLABComponents } from '../oklab.js';
import { ColorType } from '../../../ast/types.js';
import { colorDistancePrecision } from '../../constants.js';
import { toPrecisionValue } from '../../syntax.js';

/**
 * Calculate the distance between two okLab colors.
 *
 * @private
 * {@link https://drafts.csswg.org/css-color-4/#comparing-color-values}
 * @param arena
 * @param color1
 * @param color2
 */
function okLabDistance(arena, color1, color2) {
    const c1 = convertColor(arena, color1, ColorType.OKLAB);
    const c2 = convertColor(arena, color2, ColorType.OKLAB);
    if (c1 == null || c2 == null) {
        return null;
    }
    const okLab1 = getOKLABComponents(arena, c1);
    const okLab2 = getOKLABComponents(arena, c2);
    if (okLab1 == null || okLab2 == null) {
        return null;
    }
    const diff = [okLab1[0] - okLab2[0], okLab1[1] - okLab2[1], okLab1[2] - okLab2[2]];
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
function isOkLabClose(arena, color1, color2, threshold = colorDistancePrecision) {
    const c1 = convertColor(arena, color1, ColorType.OKLAB);
    const c2 = convertColor(arena, color2, ColorType.OKLAB);
    if (c1 == null || c2 == null) {
        return false;
    }
    const okLab1 = getOKLABComponents(arena, c1);
    const okLab2 = getOKLABComponents(arena, c2);
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

export { isOkLabClose, okLabDistance };
