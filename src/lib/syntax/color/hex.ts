import type {ColorToken, NumberToken, PercentageToken} from "../../../@types/index.d.ts";
import {ColorType, EnumToken} from "../../ast/index.ts";
import {color2srgbvalues, getNumber} from "./color.ts";
import {cmyk2rgbvalues, hsl2rgbvalues, hwb2rgbvalues, srgb2rgb} from "./rgb.ts";
import {COLORS_NAMES, getComponents, NAMES_COLORS} from "./utils/index.ts";
import {lab2srgbvalues, lch2srgbvalues, oklab2srgbvalues, oklch2srgbvalues} from "./srgb.ts";

function toHexString(acc: string, value: number): string {

    return acc + value.toString(16).padStart(2, '0');
}

export function reduceHexValue(value: string): string {

    if (value[0] != '#') {

        value = COLORS_NAMES[value.toLowerCase()] ?? value;
    }

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

            value = `#${value[1]}${value[3]}${value[5]}${value[7] == 'f' ? '' : value[7]}`;
        }

        if (value.endsWith('ff')) {

            value = value.slice(0, -2);
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

export function rgb2HexToken(token: ColorToken): ColorToken | null {

    let value: string | null = rgb2hexvalues(token);

    if (value == null) {
        return null;
    }

    return hexToken(value);
}

export function hsl2HexToken(token: ColorToken): ColorToken | null {

    let value: string | null = hsl2hexvalues(token);

    if (value == null) {
        return null;
    }

    return hexToken(value);
}

export function cmyk2HexToken(token: ColorToken): ColorToken | null {

    let value: string | null = cmyk2hexvalues(token);

    if (value == null) {
        return null;
    }

    return hexToken(value);
}

export function hwb2HexToken(token: ColorToken): ColorToken | null {

    let value: string | null = hwb2hexvalues(token);

    if (value == null) {
        return null;
    }

    return hexToken(value);
}

export function color2HexToken(token: ColorToken): ColorToken | null {

    let value: number[] | null = color2srgbvalues(token);

    if (value == null) {
        return null;
    }

    return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
}

export function oklab2HexToken(token: ColorToken): ColorToken | null {

    let value: number[] | null = oklab2srgbvalues(token);

    if (value == null) {
        return null;
    }

    return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
}

export function oklch2HexToken(token: ColorToken): ColorToken | null {

    let value: number[] | null = oklch2srgbvalues(token);

    if (value == null) {
        return null;
    }

    return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
}

export function lab2HexToken(token: ColorToken): ColorToken | null {

    let value: number[] | null = lab2srgbvalues(token);

    if (value == null) {
        return null;
    }

    return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
}

export function lch2HexToken(token: ColorToken): ColorToken | null {

    let value: number[] | null = lch2srgbvalues(token);

    if (value == null) {
        return null;
    }

    return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
}

function hexToken(value: string): ColorToken {

    value = reduceHexValue(value);

    return {
        typ: EnumToken.ColorTokenType,
        val: value,
        kin: value[0] == '#' ? ColorType.HEX : ColorType.LIT
    } as ColorToken;
}

export function rgb2hexvalues(token: ColorToken): string | null {

    let value: string = '#';
    let t: NumberToken | PercentageToken;

    // @ts-ignore
    const components: number[] = getComponents(token);

    if (components == null || components.length < 3) {

        return null;
    }

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
        const v: number = getNumber(t);

        // @ts-ignore
        if (v < 1) {

            // @ts-ignore
            value += Math.round(255 * getNumber(t)).toString(16).padStart(2, '0')
        }
    }

    return value;
}

export function hsl2hexvalues(token: ColorToken): string | null {

    const t: number[] | null = hsl2rgbvalues(token);

    if (t == null) {

        return null;
    }

    if (t.length == 4) {

        t[3] = srgb2rgb(t[3]);
    }

    return `${t.reduce(toHexString, '#')}`;
}

export function hwb2hexvalues(token: ColorToken): string | null {

    const t: number[] | null = hwb2rgbvalues(token);

    if (t == null) {

        return null;
    }


    if (t.length == 4) {

        t[3] = srgb2rgb(t[3]);
    }

    return `${t.reduce(toHexString, '#')}`;
}

export function cmyk2hexvalues(token: ColorToken): string | null {

    const t: number[] | null = cmyk2rgbvalues(token);

    if (t == null) {

        return null;
    }

    if (t.length == 4) {

        t[3] = srgb2rgb(t[3]);
    }

    return `#${t.reduce(toHexString, '')}`;
}
