import type {ColorToken} from "../../../@types";
import {minmax} from "./color.ts";
import {ColorKind, COLORS_NAMES} from "./utils";
import {expandHexValue} from "./hex.ts";
import {cmyk2srgb, hsl2srgbvalues, hslvalues, hwb2srgb, lab2srgb, lch2srgb, oklab2srgb, oklch2srgb} from "./srgb.ts";

export function srgb2rgb(value: number): number {

    return minmax(Math.round(value * 255), 0, 255);
}

export function hex2rgb(token: ColorToken): number[] {

    const value: string = expandHexValue(token.kin == ColorKind.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
    const rgb: number[] = [];

    for (let i = 1; i < value.length; i += 2) {

        rgb.push(parseInt(value.slice(i, i + 2), 16));
    }

    return rgb;
}

export function hwb2rgb(token: ColorToken): number[] | null {

    return hwb2srgb(token)?.map?.(srgb2rgb) ?? null;
}

export function hsl2rgb(token: ColorToken): number[] | null {

    let {h, s, l, a} = hslvalues(token) ?? {};

    if (h == null || s == null || l == null) {

        return null;
    }

    return hsl2srgbvalues(h, s, l, a).map((t: number) => minmax(Math.round(t * 255), 0, 255));
}


export function cmyk2rgb(token: ColorToken): number[] | null {

    return cmyk2srgb(token)?.map?.(srgb2rgb) ?? null;
}

export function oklab2rgb(token: ColorToken): number[] | null {

    return oklab2srgb(token)?.map?.(srgb2rgb) ?? null;
}

export function oklch2rgb(token: ColorToken): number[] | null {

    return oklch2srgb(token)?.map?.(srgb2rgb) ?? null;
}

export function lab2rgb(token: ColorToken): number[] | null {

    return lab2srgb(token)?.map?.(srgb2rgb) ?? null;
}

export function lch2rgb(token: ColorToken): number[] | null {

    return lch2srgb(token)?.map?.(srgb2rgb) ?? null;
}