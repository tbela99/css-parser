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
