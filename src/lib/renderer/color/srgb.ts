// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// srgb-linear -> srgb
// 0 <= r, g, b <= 1
import {COLORS_NAMES, getComponents} from "./utils";
import {ColorToken, DimensionToken, IdentToken, NumberToken, PercentageToken, Token} from "../../../@types";
import {color2srgbvalues, getAngle, getNumber} from "./color";
import {EnumToken} from "../../ast";
import {getLABComponents, Lab_to_sRGB, lch2labvalues} from "./lab";
import {expandHexValue} from "./hex";
import {getOKLABComponents, OKLab_to_sRGB} from "./oklab";
import {getLCHComponents} from "./lch";
import {getOKLCHComponents} from "./oklch";
import {XYZ_to_lin_sRGB} from "./xyz";
import {eq} from "../../parser/utils/eq";

export function srgbvalues(token: ColorToken): number[] | null {

    switch (token.kin) {

        case 'lit':
        case 'hex':
            return hex2srgb(token);

        case 'rgb':
        case 'rgba':
            return rgb2srgb(token);

        case 'hsl':
        case 'hsla':
            return hsl2srgb(token);

        case 'hwb':

            return hwb2srgb(token);

        case 'lab':
            return lab2srgb(token);

        case 'lch':
            return lch2srgb(token);

        case 'oklab':
            return oklab2srgb(token);

        case 'oklch':
            return oklch2srgb(token);

        case 'color':
            return color2srgbvalues(token);
    }

    return null;
}

export function rgb2srgb(token: ColorToken): number[] {

    return getComponents(token).map((t: Token, index: number) => index == 3 ? ((t.typ == EnumToken.IdenTokenType && t.val == 'none') ? 1 : getNumber(<IdentToken | NumberToken | PercentageToken>t)) : (t.typ == EnumToken.PercentageTokenType ? 255 : 1) * getNumber(<IdentToken | NumberToken | PercentageToken>t) / 255);
}

export function hex2srgb(token: ColorToken): number[] {

    const value: string = expandHexValue(token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
    const rgb: number[] = [];

    for (let i = 1; i < value.length; i += 2) {

        rgb.push(parseInt(value.slice(i, i + 2), 16) / 255);
    }

    return rgb;
}

export function xyz2srgb(x: number, y: number, z: number): number[] {

    // @ts-ignore
    return lsrgb2srgbvalues(...XYZ_to_lin_sRGB(x, y, z));
}

export function hwb2srgb(token: ColorToken): number[] {

    const {h: hue, s: white, l: black, a: alpha} = hslvalues(token);

    const rgb: number[] = hsl2srgbvalues(hue, 1, .5);

    for (let i = 0; i < 3; i++) {

        rgb[i] *= (1 - white - black);
        rgb[i] = rgb[i] + white;
    }

    if (alpha != null && alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

export function hsl2srgb(token: ColorToken): number[] {

    let {h, s, l, a} = hslvalues(token);

    return hsl2srgbvalues(h, s, l, a);
}


export function cmyk2srgb(token: ColorToken): number[] {

    const components: Token[] = getComponents(token);

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

    // @ts-ignore
    if (token.chi.length >= 9) {

        // @ts-ignore
        t = <NumberToken | PercentageToken>token.chi[8];

        // @ts-ignore
        rgb.push(getNumber(t));
    }

    return rgb;
}

export function oklab2srgb(token: ColorToken): number[] {

    const [l, a, b, alpha] = getOKLABComponents(token);

    const rgb: number[] = OKLab_to_sRGB(l, a, b);

    if (alpha != null && alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

export function oklch2srgb(token: ColorToken): number[] {

    const [l, c, h, alpha] = getOKLCHComponents(token);

    // @ts-ignore
    const rgb: number[] = OKLab_to_sRGB(...lch2labvalues(l, c, h));

    if (alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

export function hslvalues(token: ColorToken): { h: number, s: number, l: number, a?: number | null } {

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
        a = getNumber(t);
    }

    return a == null ? {h, s, l} : {h, s, l, a};
}

export function hsl2srgbvalues(h: number, s: number, l: number, a: number | null = null): number[] {

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

export function lab2srgb(token: ColorToken): number[] {

    const [l, a, b, alpha] = getLABComponents(token);
    const rgb: number[] = Lab_to_sRGB(l, a, b);

    if (alpha != null && alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

export function lch2srgb(token: ColorToken): number[] {

    // @ts-ignore
    const [l, a, b, alpha] = lch2labvalues(...getLCHComponents(token));

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

export function lsrgb2srgbvalues(r: number, g: number, b: number, alpha?: number): number[] {

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
