import {hsl2hsv} from "./hsv.ts";
import type {AngleToken, ColorToken, IdentToken, NumberToken, PercentageToken, Token} from "../../../@types/index.d.ts";
import {getComponents} from "./utils/index.ts";
import {color2srgbvalues, getAngle, getNumber, toPrecisionAngle} from "./color.ts";
import {ColorType, EnumToken} from "../../ast/index.ts";
import {cmyk2srgbvalues, lab2srgbvalues, lch2srgbvalues, oklab2srgbvalues, oklch2srgbvalues} from "./srgb.ts";

export function rgb2hwbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = rgb2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function hsl2hwbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = hsl2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function cmyk2hwbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = cmyk2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function oklab2hwbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = oklab2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function oklch2hwbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = oklch2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function lab2hwbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = lab2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function lch2hwbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = lch2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function color2hwbToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = color2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function hwbToken(values: number[]): ColorToken {

    values[0] = toPrecisionAngle(values[0] * 360);

    const chi: Token[] = <Token[]>[

        {typ: EnumToken.NumberTokenType, val: values[0]},
        {typ: EnumToken.PercentageTokenType, val: values[1] * 100},
        {typ: EnumToken.PercentageTokenType, val: values[2] * 100},
    ];

    if (values.length == 4) {

        chi.push({typ: EnumToken.LiteralTokenType, val: '/'}, {typ: EnumToken.PercentageTokenType, val: values[3] * 100});
    }

    return {
        typ: EnumToken.ColorTokenType,
        val: 'hwb',
        chi,
        kin: ColorType.HWB
    }
}

export function rgb2hwbvalues(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2hwb(...getComponents(token).map((t: Token, index: number): number => {

        if (index == 3) {

            return getNumber(<IdentToken | NumberToken | PercentageToken>t);
        }

        return getNumber(<IdentToken | NumberToken | PercentageToken>t) / 255;
    }));
}

export function cmyk2hwbvalues(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2hwb(...cmyk2srgbvalues(token));
}

export function hsl2hwbvalues(token: ColorToken): number[] {

    // @ts-ignore
    return hslvalues2hwbvalues(...getComponents(token).map((t: Token, index: number) => {

        if (index == 3 && (t.typ == EnumToken.IdenTokenType && (t as IdentToken).val == 'none')) {
            return 1;
        }

        if (index == 0) {

            return getAngle(<AngleToken | IdentToken>t);
        }

        return getNumber(<IdentToken | NumberToken | PercentageToken>t);
    }));
}

export function lab2hwbvalues(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2hwb(...lab2srgbvalues(token));
}

export function lch2hwbvalues(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2hwb(...lch2srgbvalues(token));
}

export function oklab2hwbvalues(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2hwb(...oklab2srgbvalues(token));
}

export function oklch2hwbvalues(token: ColorToken): number[] {

    const values: number[] | null = oklch2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2hwb(...values);
}

function rgb2hue(r: number, g: number, b: number, fallback: number = 0) {

    let value: number = rgb2value(r, g, b);
    let whiteness: number = rgb2whiteness(r, g, b);

    let delta: number = value - whiteness;

    if (delta > 0) {

        // calculate segment
        let segment: number = value === r ? (g - b) / delta : (value === g
            ? (b - r) / delta
            : (r - g) / delta);

        // calculate shift
        let shift: number = value === r ? segment < 0
            ? 360 / 60
            : 0 / 60 : (value === g
            ? 120 / 60
            : 240 / 60);

        // calculate hue
        return (segment + shift) * 60;
    }

    return fallback;
}

function rgb2value(r: number, g: number, b: number): number {
    return Math.max(r, g, b);
}

function rgb2whiteness(r: number, g: number, b: number): number {

    return Math.min(r, g, b);
}

export function color2hwbvalues(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2hwb(...color2srgbvalues(token));
}

export function srgb2hwb(r: number, g: number, b: number, a: number | null = null, fallback: number = 0): number[] {

    r *= 100;
    g *= 100;
    b *= 100;

    let hue: number = rgb2hue(r, g, b, fallback);
    let whiteness: number = rgb2whiteness(r, g, b);
    let value: number = Math.round(rgb2value(r, g, b));
    let blackness: number = 100 - value;

    const result: number[] = [hue / 360, whiteness / 100, blackness / 100];

    if (a != null) {
        result.push(a);
    }

    return result;
}


export function hsv2hwb(h: number, s: number, v: number, a: number | null = null): number[] {

    const result: number[] = [h, (1 - s) * v, 1 - v];

    if (a != null) {
        result.push(a);
    }

    return result;
}

export function hslvalues2hwbvalues(h: number, s: number, l: number, a: number | null = null): number[] {

    // @ts-ignore
    return hsv2hwb(...hsl2hsv(h, s, l, a));
}