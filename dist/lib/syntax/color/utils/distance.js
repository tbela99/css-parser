import { convertColor } from '../color.js';
import { getOKLABComponents } from '../oklab.js';
import { ColorType } from '../../../ast/types.js';
import { colorDistancePrecision } from '../../constants.js';

/**
 * Calculate the distance between two okLab colors.
 * @param okLab1
 * @param okLab2
 *
 * @private
 * {@link https://drafts.csswg.org/css-color-4/#comparing-color-values}
 */
function okLabDistance(color1, color2) {
    color1 = convertColor(color1, ColorType.OKLAB);
    color2 = convertColor(color2, ColorType.OKLAB);
    if (color1 == null || color2 == null) {
        return null;
    }
    const okLab1 = getOKLABComponents(color1);
    const okLab2 = getOKLABComponents(color2);
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
function isOkLabClose(color1, color2, threshold = colorDistancePrecision) {
    color1 = convertColor(color1, ColorType.OKLAB);
    color2 = convertColor(color2, ColorType.OKLAB);
    if (color1 == null || color2 == null) {
        return false;
    }
    const okLab1 = getOKLABComponents(color1);
    const okLab2 = getOKLABComponents(color2);
    for (let i = 0; i < 3; i++) {
        if (Math.abs(okLab1[i] - okLab2[i]) > threshold) {
            return false;
        }
    }
    return true;
}

export { isOkLabClose, okLabDistance };
