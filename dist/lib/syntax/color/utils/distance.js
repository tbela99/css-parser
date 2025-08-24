import { convertColor } from '../color.js';
import { getOKLABComponents } from '../oklab.js';
import { ColorType } from '../../../ast/types.js';
import '../../../ast/minify.js';
import '../../../ast/walk.js';
import '../../../parser/parse.js';
import '../../../parser/tokenize.js';
import '../../../parser/utils/config.js';
import './constants.js';
import '../../../renderer/sourcemap/lib/encode.js';

/**
 * Calculate the distance between two okLab colors.
 * @param okLab1
 * @param okLab2
 */
function okLabDistance(okLab1, okLab2) {
    return Math.sqrt(Math.pow(okLab1[0] - okLab2[0], 2) + Math.pow(okLab1[1] - okLab2[1], 2) + Math.pow(okLab1[2] - okLab2[2], 2));
}
/**
 * Check if two colors are close in okLab space.
 * @param color1
 * @param color2
 * @param threshold
 */
function isOkLabClose(color1, color2, threshold = .01) {
    color1 = convertColor(color1, ColorType.OKLAB);
    color2 = convertColor(color2, ColorType.OKLAB);
    if (color1 == null || color2 == null) {
        return false;
    }
    const okLab1 = getOKLABComponents(color1);
    const okLab2 = getOKLABComponents(color2);
    if (okLab1 == null || okLab2 == null) {
        return false;
    }
    return okLabDistance(okLab1, okLab2) < threshold;
}

export { isOkLabClose, okLabDistance };
