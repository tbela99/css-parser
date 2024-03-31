import {ColorToken, IdentToken, NumberToken, PercentageToken} from "../../../@types";
import {EnumToken} from "../../ast";
import {getNumber, minmax} from "./color";
import {cmyk2rgb, hsl2rgb, hwb2rgb, lab2rgb, lch2rgb, oklab2rgb, oklch2rgb} from "./rgb";
import {getComponents, NAMES_COLORS} from "./utils";

function toHexString(acc: string, value: number): string {

    return acc + value.toString(16).padStart(2, '0');
}

export function reduceHexValue(value: string): string {

    const named_color: string = NAMES_COLORS[expandHexValue(value)];

    if (value.length == 7) {

        if (value[1] == value[2] &&
            value[3] == value[4] &&
            value[5] == value[6]) {

            value = `#${value[1]}${value[3]}${value[5]}`;
        }
    } else if (value.length == 9) {

        if (value[1] == value[2] &&
            value[3] == value[4] &&
            value[5] == value[6] &&
            value[7] == value[8]) {

            value = `#${value[1]}${value[3]}${value[5]}${value[7]}`;
        }
    }

    return named_color != null && named_color.length <= value.length ? named_color : value;
}

export function expandHexValue(value: string): string {

    if (value.length == 4) {

        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }

    if (value.length == 5) {

        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${value[4]}${value[4]}`;
    }

    return value;
}


export function rgb2hex(token: ColorToken) {

    let value: string = '#';
    let t: NumberToken | PercentageToken;

    // @ts-ignore
    const components: number[] = getComponents(token);

    // @ts-ignore
    for (let i = 0; i < 3; i++) {

        // @ts-ignore
        t = components[i];

        // @ts-ignore
        value += (t.typ == EnumToken.Iden && t.val == 'none' ? '0' : Math.round(getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 255 : 1))).toString(16).padStart(2, '0')
    }

    // @ts-ignore
    if (components.length == 4) {

        // @ts-ignore
        t = components[3];

        // @ts-ignore
        const v: number = ((<IdentToken>t).typ == EnumToken.IdenTokenType && (<IdentToken>t).val == 'none') ? 1 : getNumber(t);

        // @ts-ignore
        if (v < 1) {

            // @ts-ignore
            value += Math.round(255 * getNumber(t)).toString(16).padStart(2, '0')
        }
    }

    return value;
}

export function hsl2hex(token: ColorToken) {

    return `${hsl2rgb(token).reduce(toHexString, '#')}`;
}

export function hwb2hex(token: ColorToken): string {

    return `${hwb2rgb(token).reduce(toHexString, '#')}`;
}

export function cmyk2hex(token: ColorToken): string {

    return `#${cmyk2rgb(token).reduce(toHexString, '')}`;
}

export function oklab2hex(token: ColorToken): string {

    return `${oklab2rgb(token).reduce(toHexString, '#')}`;
}

export function oklch2hex(token: ColorToken): string {

    return `${oklch2rgb(token).reduce(toHexString, '#')}`;
}

export function lab2hex(token: ColorToken): string {

    return `${lab2rgb(token).reduce(toHexString, '#')}`;
}

export function lch2hex(token: ColorToken): string {

    return `${lch2rgb(token).reduce(toHexString, '#')}`;
}

export function srgb2hexvalues(r: number, g: number, b: number, alpha?: number | null): string {

    return [r, g, b].concat(alpha == null || alpha == 1 ? [] : [alpha]).reduce((acc: string, value: number): string => acc + minmax(Math.round(255 * value), 0, 255).toString(16).padStart(2, '0'), '#');
}
