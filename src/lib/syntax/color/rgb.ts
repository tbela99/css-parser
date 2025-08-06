import type {ColorToken, Token} from "../../../@types/index.d.ts";
import {color2srgbvalues, minmax} from "./color.ts";
import {COLORS_NAMES} from "./utils/index.ts";
import {expandHexValue} from "./hex.ts";
import {
    cmyk2srgbvalues,
    hslvalues,
    hslvalues2srgbvalues,
    hwb2srgbvalues,
    lab2srgbvalues,
    lch2srgbvalues,
    oklab2srgbvalues,
    oklch2srgbvalues
} from "./srgb.ts";
import {ColorType, EnumToken} from "../../ast/index.ts";

export function srgb2rgb(value: number): number {

    return minmax(Math.round(value * 255), 0, 255);
}

export function hex2RgbToken(token: ColorToken): ColorToken | null {

    return rgb2RgbToken(hex2rgbvalues(token));
}

export function hsl2RgbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = hsl2rgbvalues(token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(values);
}

export function hwb2RgbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = hwb2rgbvalues(token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(values);
}

export function cmyk2RgbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = cmyk2rgbvalues(token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(values);
}

export function oklab2RgbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = oklab2rgbvalues(token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(values);
}

export function oklch2RgbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = oklch2rgbvalues(token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(values);
}

export function lab2RgbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = lab2rgbvalues(token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(values);
}

export function lch2RgbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = lch2rgbvalues(token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(values);
}

export function color2RgbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = color2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(values.map((t: number, index: number) => index == 3 ? t : srgb2rgb(t)));
}

function rgb2RgbToken(values: number[]): ColorToken | null {

    const chi: Token[] = <Token[]>[

        {typ: EnumToken.NumberTokenType, val: String(values[0])},
        {typ: EnumToken.NumberTokenType, val: String(values[1])},
        {typ: EnumToken.NumberTokenType, val: String(values[2])},
    ];

    if (values.length == 4) {

        chi.push({typ: EnumToken.PercentageTokenType, val: (values[3] * 100).toFixed()});
    }

    return {
        typ: EnumToken.ColorTokenType,
        val: 'rgb',
        chi,
        kin: ColorType.RGB
    }
}
export function hex2rgbvalues(token: ColorToken): number[] {

    const value: string = expandHexValue(token.kin == ColorType.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
    const rgb: number[] = [];

    for (let i = 1; i < value.length; i += 2) {

        rgb.push(parseInt(value.slice(i, i + 2), 16));
    }

    if (rgb.length == 4) {

        if (rgb[3] == 255) {

            rgb.pop();
        }

        else {

            rgb[3] = +(rgb[3] / 255).toFixed(2);
        }
    }

    return rgb;
}

export function hwb2rgbvalues(token: ColorToken): number[] | null {

    return hwb2srgbvalues(token)?.map?.((t: number, index: number) => index == 3 ? t : srgb2rgb(t)) ?? null;
}

export function hsl2rgbvalues(token: ColorToken): number[] | null {

    let {h, s, l, a} = hslvalues(token) ?? {};

    if (h == null || s == null || l == null) {

        return null;
    }

    return hslvalues2srgbvalues(h, s, l).map((t: number) => minmax(Math.round(t * 255), 0, 255)).concat(a == 1 || a == null ? [] : [a]);
}

export function hsl2srgbvalues(token: ColorToken): number[] | null {

    let {h, s, l, a} = hslvalues(token) ?? {};

    if (h == null || s == null || l == null) {

        return null;
    }

    return hslvalues2srgbvalues(h, s, l).concat(a == 1 || a == null ? [] : [a]);
}

export function cmyk2rgbvalues(token: ColorToken): number[] | null {

    return cmyk2srgbvalues(token)?.map?.((t: number, index: number) => index == 3 ? t : srgb2rgb(t)) ?? null;
}

export function oklab2rgbvalues(token: ColorToken): number[] | null {

    return oklab2srgbvalues(token)?.map?.((t: number, index: number) => index == 3 ? t : srgb2rgb(t )) ?? null;
}

export function oklch2rgbvalues(token: ColorToken): number[] | null {

    return oklch2srgbvalues(token)?.map?.((t: number, index: number) => index == 3 ? t : srgb2rgb(t)) ?? null;
}

export function lab2rgbvalues(token: ColorToken): number[] | null {

    return lab2srgbvalues(token)?.map?.((t: number, index: number) => index == 3 ? t : srgb2rgb(t)) ?? null;
}

export function lch2rgbvalues(token: ColorToken): number[] | null {

    return lch2srgbvalues(token)?.map?.((t: number, index: number) => index == 3 ? t : srgb2rgb(t)) ?? null;
}