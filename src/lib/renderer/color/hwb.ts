import {hsl2hsv} from "./hsv.ts";
import type {AngleToken, ColorToken, IdentToken, NumberToken, PercentageToken, Token} from "../../../@types/index.d.ts";
import {getComponents} from "./utils/index.ts";
import {getAngle, getNumber} from "./color.ts";
import {EnumToken} from "../../ast/index.ts";
import {lab2srgb, lch2srgb, oklab2srgb, oklch2srgb} from "./srgb.ts";

export function rgb2hwb(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2hwb(...getComponents(token).map((t: Token, index: number): number => {

        if (index == 3 && t.typ == EnumToken.IdenTokenType && (t as IdentToken).val == 'none') {
            return 1;
        }

        return getNumber(<IdentToken | NumberToken | PercentageToken>t) / 255;
    }));
}

export function hsl2hwb(token: ColorToken): number[] {

    // @ts-ignore
    return hsl2hwbvalues(...getComponents(token).map((t: Token, index: number) => {

        if (index == 3 && (t.typ == EnumToken.IdenTokenType && (t as IdentToken).val == 'none')) {
            return 1;
        }

        if (index == 0) {

            return getAngle(<AngleToken | IdentToken>t);
        }

        return getNumber(<IdentToken | NumberToken | PercentageToken>t);
    }));
}

export function lab2hwb(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2hwb(...lab2srgb(token));
}

export function lch2hwb(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2hwb(...lch2srgb(token));
}

export function oklab2hwb(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2hwb(...oklab2srgb(token));
}

export function oklch2hwb(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2hwb(...oklch2srgb(token));
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

export function hsl2hwbvalues(h: number, s: number, l: number, a: number | null = null): number[] {

    // @ts-ignore
    return hsv2hwb(...hsl2hsv(h, s, l, a));
}