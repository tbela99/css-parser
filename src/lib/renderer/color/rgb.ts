import type {ColorToken} from "../../../@types/index.d.ts";
import {minmax} from "./color";
import {COLORS_NAMES} from "./utils";
import {expandHexValue} from "./hex";
import {cmyk2srgb, hsl2srgbvalues, hslvalues, hwb2srgb, lab2srgb, lch2srgb, oklab2srgb, oklch2srgb} from "./srgb";

export function srgb2rgb(value: number): number {

    return minmax(Math.round(value * 255), 0, 255);
}

export function hex2rgb(token: ColorToken): number[] {

    const value: string = expandHexValue(token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
    const rgb: number[] = [];

    for (let i = 1; i < value.length; i += 2) {

        rgb.push(parseInt(value.slice(i, i + 2), 16));
    }

    return rgb;
}

export function hwb2rgb(token: ColorToken): number[] {

    return hwb2srgb(token).map(srgb2rgb);
}

export function hsl2rgb(token: ColorToken): number[] {

    let {h, s, l, a} = hslvalues(token);

    return hsl2srgbvalues(h, s, l, a).map((t: number) => minmax(Math.round(t * 255), 0, 255));
}


export function cmyk2rgb(token: ColorToken): number[] {

    return cmyk2srgb(token).map(srgb2rgb);
}

export function oklab2rgb(token: ColorToken): number[] {

    return oklab2srgb(token).map(srgb2rgb);
}

export function oklch2rgb(token: ColorToken): number[] {

    return oklch2srgb(token).map(srgb2rgb);
}

export function lab2rgb(token: ColorToken): number[] {

    return lab2srgb(token).map(srgb2rgb);
}

export function lch2rgb(token: ColorToken): number[] {

    return lch2srgb(token).map(srgb2rgb);
}