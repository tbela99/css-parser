/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { ColorType } from '../../../ast/types.js';

/**
 * Return the color type of the color components
 * @param arena
 * @param color
 */
function getColorType(arena, color) {
    if (arena.colorType[color] === ColorType.COLOR_MIX || arena.strings[arena.unit[color]] === "rel") {
        const token = arena.getTokenAt(color, 2);
        if (token == null) {
            return null;
        }
        return arena.colorType[color] === ColorType.COLOR_MIX
            ? ColorType[arena.strings[arena.stringValue[token]]
                ?.toUpperCase?.()
                ?.replace?.("-", "_")]
            : getColorType(arena, token);
    }
    return arena.colorType[color];
}

export { getColorType };
