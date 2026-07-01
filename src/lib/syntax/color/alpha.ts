import type { ColorToken, Token } from "../../../@types/index.ts";
import { ColorType } from "../../ast/types.ts";
import { convertColor } from "./color.ts";
import { getColorComponents } from "./utils/components.ts";
import { makeColor } from "./utils/make-color.ts";
import {getColorType} from "./utils/color-type.ts";


export function alpha(color: ColorToken, alpha?: Token): ColorToken | null {

    if (alpha == null) {
        return color;
    }

    if (color.kin === ColorType.DEVICE_CMYK) {
        
        return null;
    }

    if (alpha == null) {
        
        return color;
    }

    if (color.kin === ColorType.COLOR_MIX || color.cal === 'rel')  {

        color = convertColor(color, getColorType(color) as ColorType) as ColorToken;

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
