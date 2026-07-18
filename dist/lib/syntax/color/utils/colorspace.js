import { equalsIgnoreCase } from '../../../parser/utils/text.js';
import { getColorComponents } from './components.js';

/**
 * Return the color space of the color
 * @param color
 * @returns
 */
function getColorSpace(color) {
    // if (!("chi" in color)) {
    //     return "rgb";
    // }
    let name;
    const components = getColorComponents(color);
    if (components == null || components.length < 3) {
        return null;
    }
    if (equalsIgnoreCase("color", color.val)) {
        if (equalsIgnoreCase("from", components[0].val)) {
            name = components[2].val;
        }
        else {
            name = components[0].val;
        }
    }
    else if (equalsIgnoreCase("color-mix", color.val)) {
        if (equalsIgnoreCase("in", components[0].val)) {
            name = components[1].val;
        }
        else {
            return "oklab";
        }
    }
    else {
        name = color.val;
    }
    return name == "device-cmyk"
        ? "cmyk"
        : name.startsWith("xyz")
            ? "xyz"
            : ["srgb", "srgb-linear", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020", "rgb"].some((t) => equalsIgnoreCase(t, name))
                ? "rgb"
                : name.slice(-3);
}

export { getColorSpace };
