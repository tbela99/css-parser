import {ColorToken, DimensionToken, NumberToken, PercentageToken, Token} from "../../../@types";
import {getAngle, getNumber, minmax} from "./color";
import {COLORS_NAMES, getComponents} from "./utils";
import {expandHexValue} from "./hex";
import {EnumToken} from "../../ast";
import {cmyk2srgb, hwb2srgb, lab2srgb, lch2srgb, oklab2srgb, oklch2srgb} from "./srgb";

function srgb2rgb(value: number): number {

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

    return hsl2rgbvalues(h, s, l, a);
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

export function hslvalues(token: ColorToken): {h: number, s: number, l: number, a?: number | null} {

    const components: Token[] = getComponents(token);

    let t: PercentageToken | NumberToken;

    // @ts-ignore
    let h: number = getAngle(<NumberToken | DimensionToken>components[0]);

    // @ts-ignore
    t = <NumberToken | DimensionToken>components[1];
    // @ts-ignore
    let s: number = getNumber(t);
    // @ts-ignore
    t = <NumberToken | DimensionToken>components[2];
    // @ts-ignore
    let l: number = getNumber(t);

    let a = null;

    if (token.chi?.length == 4) {

        // @ts-ignore
        t = token.chi[3];

        // @ts-ignore
        if ((t.typ == EnumToken.IdenTokenType && t.val == 'none') || (
                t.typ == EnumToken.PercentageTokenType && +t.val < 100) ||
            // @ts-ignore
            (t.typ == EnumToken.NumberTokenType && t.val < 1)) {

            // @ts-ignore
            a = getNumber(t);
        }
    }

    return a == null ? {h, s, l} : {h, s, l, a};
}

export function hsl2rgbvalues(h: number, s: number, l: number, a: number | null = null): number[] {

    let v: number = l <= .5 ? l * (1.0 + s) : l + s - l * s;

    let r: number = l;
    let g: number = l;
    let b: number = l;

    if (v > 0) {

        let m: number = l + l - v;
        let sv: number = (v - m) / v;
        h *= 6.0;
        let sextant: number = Math.floor(h);
        let fract: number = h - sextant;
        let vsf: number = v * sv * fract;
        let mid1: number = m + vsf;
        let mid2: number = v - vsf;

        switch (sextant) {
            case 0:
                r = v;
                g = mid1;
                b = m;
                break;
            case 1:
                r = mid2;
                g = v;
                b = m;
                break;
            case 2:
                r = m;
                g = v;
                b = mid1;
                break;
            case 3:
                r = m;
                g = mid2;
                b = v;
                break;
            case 4:
                r = mid1;
                g = m;
                b = v;
                break;
            case 5:
                r = v;
                g = m;
                b = mid2;
                break;
        }
    }

    const values: number[] = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];

    if (a != null && a != 1) {

        values.push(Math.round(a * 255));
    }

    return values;
}
