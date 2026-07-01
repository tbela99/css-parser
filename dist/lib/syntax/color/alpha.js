import { ColorType } from '../../ast/types.js';
import { convertColor } from './color.js';
import { getColorComponents } from './utils/components.js';
import { makeColor } from './utils/make-color.js';
import { getColorType } from './utils/color-type.js';

function alpha(color, alpha) {
    if (alpha == null) {
        return color;
    }
    if (color.kin === ColorType.DEVICE_CMYK) {
        return null;
    }
    if (alpha == null) {
        return color;
    }
    if (color.kin === ColorType.COLOR_MIX || color.cal === 'rel') {
        color = convertColor(color, getColorType(color));
        if (color == null) {
            return null;
        }
    }
    const components = getColorComponents(color);
    if (components == null) {
        return null;
    }
    return makeColor(color.kin, components, alpha);
}

export { alpha };
