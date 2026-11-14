/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { equalsIgnoreCase } from '../../../parser/utils/text.js';
import { getColorComponents } from './components.js';

/**
 * Return the color space of the color
 * @param arena
 * @param color
 * @returns
 */
function getColorSpace(arena, color) {
    let name;
    const components = getColorComponents(arena, color);
    if (components == null || components.length < 3) {
        return null;
    }
    if (equalsIgnoreCase("color", arena.strings[arena.stringValue[color]])) {
        if (equalsIgnoreCase("from", arena.strings[arena.stringValue[components[0]]])) {
            name = arena.strings[arena.stringValue[components[2]]];
        }
        else {
            name = arena.strings[arena.stringValue[components[0]]];
        }
    }
    else if (equalsIgnoreCase("color-mix", arena.strings[arena.stringValue[color]])) {
        if (equalsIgnoreCase("in", arena.strings[arena.stringValue[components[0]]])) {
            name = arena.strings[arena.stringValue[components[1]]];
        }
        else {
            return "oklab";
        }
    }
    else {
        name = arena.strings[arena.stringValue[color]];
    }
    return name === "device-cmyk"
        ? "cmyk"
        : name.startsWith("xyz")
            ? "xyz"
            : ["srgb", "srgb-linear", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020", "rgb"].some((t) => equalsIgnoreCase(t, name))
                ? "rgb"
                : name.slice(-3);
}

export { getColorSpace };
