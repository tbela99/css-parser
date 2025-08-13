// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// srgb-linear -> srgb
// 0 <= r, g, b <= 1
import {COLORS_NAMES, getComponents} from "./utils/index.ts";
import type {
    ColorToken,
    DimensionToken,
    IdentToken,
    NumberToken,
    PercentageToken,
    Token
} from "../../../@types/index.d.ts";
import {color2srgbvalues, getAngle, getNumber} from "./color.ts";
import {ColorType, EnumToken} from "../../ast/index.ts";
import {getLABComponents, Lab_to_sRGB, lchvalues2labvalues} from "./lab.ts";
import {expandHexValue} from "./hex.ts";
import {getOKLABComponents, OKLab_to_sRGB} from "./oklab.ts";
import {getLCHComponents} from "./lch.ts";
import {getOKLCHComponents} from "./oklch.ts";
import {XYZ_to_lin_sRGB} from "./xyz.ts";

export function srgbvalues(token: ColorToken): number[] | null {

    switch (token.kin) {

        case ColorType.LIT:
        case ColorType.HEX:
            return hex2srgbvalues(token);

        case ColorType.RGB:
        case ColorType.RGBA:
            return rgb2srgb(token);

        case ColorType.HSL:
        case ColorType.HSLA:
            return hsl2srgb(token);

        case ColorType.HWB:

            return hwb2srgbvalues(token);

        case ColorType.LAB:
            return lab2srgbvalues(token);

        case ColorType.LCH:
            return lch2srgbvalues(token);

        case ColorType.OKLAB:
            return oklab2srgbvalues(token);

        case ColorType.OKLCH:
            return oklch2srgbvalues(token);

        case ColorType.COLOR:
            return color2srgbvalues(token);
    }

    return null;
}

export function rgb2srgb(token: ColorToken): number[] | null {

    return getComponents(token)?.map?.((t: Token, index: number): number => index == 3 ? ((t.typ == EnumToken.IdenTokenType && (t as IdentToken).val == 'none') ? 1 : getNumber(<IdentToken | NumberToken | PercentageToken>t)) : (t.typ == EnumToken.PercentageTokenType ? 255 : 1) * getNumber(<IdentToken | NumberToken | PercentageToken>t) / 255) ?? null;
}

export function rgb2srgbvalues(token: ColorToken): number[] | null {

    return getComponents(token)?.map?.((t: Token, index: number): number => index == 3 ? getNumber(<IdentToken | NumberToken | PercentageToken>t) : getNumber(<IdentToken | NumberToken | PercentageToken>t) / 255) ?? null;
}

export function rgbvalues2srgbvalues(r: number, g: number, b: number, a: number | null = null): number[] | null {

    const result = [r / 255, g / 255, b / 255];

    if (a != null && a != 1) {

        result.push(a);
    }

    return result;
}

export function hex2srgbvalues(token: ColorToken): number[] {

    const value: string = expandHexValue(token.kin == ColorType.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
    const rgb: number[] = [];

    for (let i = 1; i < value.length; i += 2) {

        rgb.push(parseInt(value.slice(i, i + 2), 16) / 255);
    }

    if (rgb.length == 4) {

        rgb[3] = +rgb[3].toFixed(2);
    }

    return rgb;
}

// xyz d65 input
export function xyz2srgb(x: number, y: number, z: number, alpha: number | null = null): number[] {

    // @ts-ignore
    return lsrgb2srgbvalues(...XYZ_to_lin_sRGB(x, y, z, alpha));
}

export function hwb2srgbvalues(token: ColorToken): number[] | null {

    const {h: hue, s: white, l: black, a: alpha} = hslvalues(token) ?? {};

    if (hue == null || white == null || black == null) {

        return [];
    }

    const rgb: number[] = hslvalues2srgbvalues(hue, 1, .5);

    for (let i = 0; i < 3; i++) {

        rgb[i] *= (1 - white - black);
        rgb[i] = rgb[i] + white;
    }

    if (alpha != null && alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

export function hsl2srgb(token: ColorToken): number[] | null {

    let {h, s, l, a} = hslvalues(token) ?? {};

    if (h == null || s == null || l == null) {

        return null;
    }

    return hslvalues2srgbvalues(h, s, l, a);
}


export function cmyk2srgbvalues(token: ColorToken): number[] | null {

    const components: Token[] | null = getComponents(token);

    if (components == null) {

        return null;
    }

    // @ts-ignore
    let t: NumberToken | PercentageToken = <NumberToken | PercentageToken>components[0];

    // @ts-ignore
    const c: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[1];

    // @ts-ignore
    const m: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[2];

    // @ts-ignore
    const y: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[3];

    // @ts-ignore
    const k: number = getNumber(t);

    const rgb: number[] = [
        1 - Math.min(1, c * (1 - k) + k),
        1 - Math.min(1, m * (1 - k) + k),
        1 - Math.min(1, y * (1 - k) + k)
    ];

    if (components.length == 5) {

        rgb.push(getNumber(components[4] as NumberToken | PercentageToken));
    }

    // @ts-ignore
    // if (token.chi.length >= 9) {
    //
    //     // @ts-ignore
    //     t = <NumberToken | PercentageToken>token.chi[8];
    //
    //     // @ts-ignore
    //     rgb.push(getNumber(t));
    // }

    return rgb;
}

export function oklab2srgbvalues(token: ColorToken): number[] | null {

    const [l, a, b, alpha] = getOKLABComponents(token) ?? [];

    if (l == null || a == null || b == null) {

        return null;
    }

    const rgb: number[] = OKLab_to_sRGB(l, a, b);

    if (alpha != null && alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

export function oklch2srgbvalues(token: ColorToken): number[] | null {

    const [l, c, h, alpha] = getOKLCHComponents(token) ?? [];

    if (l == null || c == null || h == null) {

        return null;
    }

    // @ts-ignore
    const rgb: number[] = OKLab_to_sRGB(...lchvalues2labvalues(l, c, h));

    if (alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

export function hslvalues(token: ColorToken): { h: number, s: number, l: number, a?: number | null } | null {

    const components: Token[] | null = getComponents(token);

    if (components == null) {

        return null;
    }

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

    if (components.length == 4) {

        // @ts-ignore
        t = components[3];

        // @ts-ignore
        a = getNumber(t);
    }

    return a == null ? {h, s, l} : {h, s, l, a};
}

export function hslvalues2srgbvalues(h: number, s: number, l: number, a: number | null = null): number[] {

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

    const values: number[] = [r, g, b];

    if (a != null && a != 1) {

        values.push(a);
    }

    return values;
}

export function lab2srgbvalues(token: ColorToken): number[] | null {

    const [l, a, b, alpha] = getLABComponents(token) ?? [];

    if (l == null || a == null || b == null) {

        return null;
    }

    const rgb: number[] = Lab_to_sRGB(l, a, b);

    if (alpha != null && alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

export function lch2srgbvalues(token: ColorToken): number[] | null {

    // @ts-ignore
    const [l, a, b, alpha] = lchvalues2labvalues(...getLCHComponents(token));

    if (l == null || a == null || b == null) {

        return null;
    }

    // https://www.w3.org/TR/css-color-4/#lab-to-lch
    const rgb: number[] = Lab_to_sRGB(l, a, b);

    if (alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

// sRGB -> lRGB
export function srgb2lsrgbvalues(r: number, g: number, b: number, a: number | null = null): number[] {

    // convert an array of linear-light sRGB values in the range 0.0-1.0
    // to gamma corrected form
    // https://en.wikipedia.org/wiki/SRGB
    // Extended transfer function:
    // For negative values, linear portion extends on reflection
    // of axis, then uses reflected pow below that
    const rgb: number[] = [r, g, b].map((val: number): number => {

        const abs: number = Math.abs(val);
        if (abs <= 0.04045) {
            return val / 12.92;
        }
        return (Math.sign(val) || 1) * Math.pow((abs + 0.055) / 1.055, 2.4);
    });

    if (a != 1 && a != null) {
        rgb.push(a);
    }

    return rgb;
}

export function lsrgb2srgbvalues(r: number, g: number, b: number, alpha: number | null = null): number[] {

    // convert an array of linear-light sRGB values in the range 0.0-1.0
    // to gamma corrected form
    // https://en.wikipedia.org/wiki/SRGB
    // Extended transfer function:
    // For negative values, linear portion extends on reflection
    // of axis, then uses reflected pow below that
    const rgb: number[] = [r, g, b].map((val: number): number => {

        let abs: number = Math.abs(val);

        if (Math.abs(val) > 0.0031308) {

            return (Math.sign(val) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
        }

        return 12.92 * val;
    });

    if (alpha != 1 && alpha != null) {
        rgb.push(alpha);
    }

    return rgb;
}
