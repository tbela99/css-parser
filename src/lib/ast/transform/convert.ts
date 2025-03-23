import type {LengthToken, NumberToken} from "../../../@types/token.d.ts";
import {EnumToken} from "../types.ts";

// https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Values_and_units#absolute_length_units
export function length2Px(value: LengthToken | NumberToken): number | null {

    if (value.typ == EnumToken.NumberTokenType) {

        return +value.val;
    }

    switch (value.unit) {
        case 'cm':
            // @ts-ignore
            return value.val * 37.8;
        case 'mm':
            // @ts-ignore
            return value.val * 3.78;
        case 'Q':
            // @ts-ignore
            return value.val * 37.8 / 40;
        case 'in':
            // @ts-ignore
            return value.val / 96;
        case 'pc':
            // @ts-ignore
            return value.val / 16;
        case 'pt':
            // @ts-ignore
            return value.val * 4 / 3;
        case 'px':
            return +value.val;
    }

    return null;
}