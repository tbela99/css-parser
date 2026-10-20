/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
<<<<<<< HEAD
	Version: 2.0.0-alpha.1
=======
	Version: 1.6.8
>>>>>>> v.next
	License: MIT
 */
import { ColorType } from '../../../ast/types.js';

/**
 * Return the color type of the color components
 */
function getColorType(color) {
    if (color.kin === ColorType.COLOR_MIX || color.cal === "rel") {
        return color.kin === ColorType.COLOR_MIX
            ? // @ts-expect-error
                ColorType[
                // @ts-expect-error
                color.chi[2]?.val?.toUpperCase?.()?.replace?.("-", "_")]
            : getColorType(color.chi[2]);
    }
    return color.kin;
}

export { getColorType };
