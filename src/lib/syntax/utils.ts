// https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Values_and_units#absolute_length_units
import type {LengthToken, NumberToken} from "../../@types";
import {EnumToken} from "../ast";

export function length2Px(value: LengthToken | NumberToken): number | null {

    let result: number | null = null;
    if (value.typ == EnumToken.NumberTokenType) {

        result = +value.val;
    } else {

        switch ((value as LengthToken).unit) {
            case 'cm':
                // @ts-ignore
                result = (value as LengthToken).val * 37.8;
                break;
            case 'mm':
                // @ts-ignore
                result = (value as LengthToken).val * 3.78;
                break;
            case 'Q':
                // @ts-ignore
                result = (value as LengthToken).val * 37.8 / 40;
                break;
            case 'in':
                // @ts-ignore
                result = (value as LengthToken).val / 96;
                break;
            case 'pc':
                // @ts-ignore
                result = (value as LengthToken).val / 16;
                break;
            case 'pt':
                // @ts-ignore
                result = (value as LengthToken).val * 4 / 3;
                break;
            case 'px':
                result = +(value as LengthToken).val;
                break;
        }
    }


    return isNaN(result as number) ? null : result;
}

/**
 * minify number
 * @param val
 */
export function minifyNumber(val: string | number): string {

    val = String(+val);

    if (val === '0') {

        return '0';
    }

    const chr: string = val.charAt(0);

    if (chr == '-') {

        const slice: string = val.slice(0, 2);

        if (slice == '-0') {

            return val.length == 2 ? '0' : '-' + val.slice(2);
        }

    }

    if (chr == '0') {

        return val.slice(1);
    }

    return val;
}