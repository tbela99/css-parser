import { roundWithPrecision } from './utils/round.js';
import { COLORS_NAMES } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import { getNumber, getAngle } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { expandHexValue } from './hex.js';
import { getLABComponents, Lab_to_sRGB, lch2labvalues } from './lab.js';
import { getOKLABComponents, OKLab_to_sRGB } from './oklab.js';
import { getLCHComponents } from './lch.js';
import { getOKLCHComponents } from './oklch.js';
import '../sourcemap/lib/encode.js';

// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// srgb-linear -> srgb
// 0 <= r, g, b <= 1
function rgb2srgb(token) {
    return getComponents(token).map((t) => getNumber(t) / 255);
}
function hex2srgb(token) {
    const value = expandHexValue(token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
    const rgb = [];
    for (let i = 1; i < value.length; i += 2) {
        rgb.push(parseInt(value.slice(i, i + 2), 16) / 255);
    }
    return rgb;
}
function hwb2srgb(token) {
    const { h: hue, s: white, l: black, a: alpha } = hslvalues(token);
    const rgb = hsl2srgbvalues(hue, 1, .5);
    for (let i = 0; i < 3; i++) {
        rgb[i] *= (1 - white - black);
        rgb[i] = rgb[i] + white;
    }
    if (alpha != null && alpha != 1) {
        rgb.push(alpha);
    }
    return rgb;
}
function hsl2srgb(token) {
    let { h, s, l, a } = hslvalues(token);
    return hsl2srgbvalues(h, s, l, a);
}
function cmyk2srgb(token) {
    const components = getComponents(token);
    // @ts-ignore
    let t = components[0];
    // @ts-ignore
    const c = getNumber(t);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    const m = getNumber(t);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    const y = getNumber(t);
    // @ts-ignore
    t = components[3];
    // @ts-ignore
    const k = getNumber(t);
    const rgb = [
        1 - Math.min(1, c * (1 - k) + k),
        1 - Math.min(1, m * (1 - k) + k),
        1 - Math.min(1, y * (1 - k) + k)
    ];
    // @ts-ignore
    if (token.chi.length >= 9) {
        // @ts-ignore
        t = token.chi[8];
        // @ts-ignore
        rgb.push(getNumber(t));
    }
    return rgb;
}
function oklab2srgb(token) {
    const [l, a, b, alpha] = getOKLABComponents(token);
    const rgb = OKLab_to_sRGB(l, a, b);
    if (alpha != null && alpha != 1) {
        rgb.push(alpha);
    }
    return rgb; //.map(((value: number) => minmax(value, 0, 255)));
}
function oklch2srgb(token) {
    const [l, c, h, alpha] = getOKLCHComponents(token);
    // @ts-ignore
    const rgb = OKLab_to_sRGB(...lch2labvalues(l, c, h));
    if (alpha != 1) {
        rgb.push(alpha);
    }
    return rgb; //.map(((value: number): number => minmax(Math.round(255 * value), 0, 255)));
}
function hslvalues(token) {
    const components = getComponents(token);
    let t;
    // @ts-ignore
    let h = getAngle(components[0]);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    let s = getNumber(t);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    let l = getNumber(t);
    let a = null;
    if (token.chi?.length == 4) {
        // @ts-ignore
        t = token.chi[3];
        // @ts-ignore
        if ((t.typ == EnumToken.IdenTokenType && t.val == 'none') || (t.typ == EnumToken.PercentageTokenType && +t.val < 100) ||
            // @ts-ignore
            (t.typ == EnumToken.NumberTokenType && t.val < 1)) {
            // @ts-ignore
            a = getNumber(t);
        }
    }
    return a == null ? { h, s, l } : { h, s, l, a };
}
function hsl2srgbvalues(h, s, l, a = null) {
    let v = l <= .5 ? l * (1.0 + s) : l + s - l * s;
    let r = l;
    let g = l;
    let b = l;
    if (v > 0) {
        let m = l + l - v;
        let sv = (v - m) / v;
        h *= 6.0;
        let sextant = Math.floor(h);
        let fract = h - sextant;
        let vsf = v * sv * fract;
        let mid1 = m + vsf;
        let mid2 = v - vsf;
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
    const values = [r, g, b];
    if (a != null && a != 1) {
        values.push(a);
    }
    return values;
}
function lab2srgb(token) {
    const [l, a, b, alpha] = getLABComponents(token);
    const rgb = Lab_to_sRGB(l, a, b);
    //
    if (alpha != null && alpha != 1) {
        rgb.push(alpha);
    }
    return rgb;
}
function lch2srgb(token) {
    // @ts-ignore
    const [l, a, b, alpha] = lch2labvalues(...getLCHComponents(token));
    // https://www.w3.org/TR/css-color-4/#lab-to-lch
    const rgb = Lab_to_sRGB(l, a, b);
    //
    if (alpha != 1) {
        rgb.push(alpha);
    }
    return rgb;
}
// sRGB -> lRGB
function gam_sRGB(r, g, b, a = null) {
    // convert an array of linear-light sRGB values in the range 0.0-1.0
    // to gamma corrected form
    // https://en.wikipedia.org/wiki/SRGB
    // Extended transfer function:
    // For negative values, linear portion extends on reflection
    // of axis, then uses reflected pow below that
    const rgb = [r, g, b].map((val) => {
        const abs = Math.abs(val);
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
function sRGB_gam(r, g, b) {
    // convert an array of linear-light sRGB values in the range 0.0-1.0
    // to gamma corrected form
    // https://en.wikipedia.org/wiki/SRGB
    // Extended transfer function:
    // For negative values, linear portion extends on reflection
    // of axis, then uses reflected pow below that
    return [r, g, b].map((val) => {
        let abs = Math.abs(val);
        if (Math.abs(val) > 0.0031308) {
            return (Math.sign(val) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
        }
        return 12.92 * val;
    });
}
// export function gam_a98rgb(r: number, g: number, b: number): number[] {
//     // convert an array of linear-light a98-rgb  in the range 0.0-1.0
//     // to gamma corrected form
//     // negative values are also now accepted
//     return [r, g, b].map(function (val: number): number {
//         let sign: number = val < 0? -1 : 1;
//         let abs: number = Math.abs(val);
//
//         return roundWithPrecision(sign * Math.pow(abs, 256/563), val);
//     });
// }
function lin_ProPhoto(r, g, b) {
    // convert an array of prophoto-rgb values
    // where in-gamut colors are in the range [0.0 - 1.0]
    // to linear light (un-companded) form.
    // Transfer curve is gamma 1.8 with a small linear portion
    // Extended transfer function
    const Et2 = 16 / 512;
    return [r, g, b].map(function (val) {
        let sign = val < 0 ? -1 : 1;
        let abs = Math.abs(val);
        if (abs <= Et2) {
            return roundWithPrecision(val / 16);
        }
        return roundWithPrecision(sign * Math.pow(abs, 1.8));
    });
}
function lin_a98rgb(r, g, b) {
    // convert an array of a98-rgb values in the range 0.0 - 1.0
    // to linear light (un-companded) form.
    // negative values are also now accepted
    return [r, g, b].map(function (val) {
        let sign = val < 0 ? -1 : 1;
        let abs = Math.abs(val);
        return roundWithPrecision(sign * Math.pow(abs, 563 / 256));
    });
}
function lin_2020(r, g, b) {
    // convert an array of rec2020 RGB values in the range 0.0 - 1.0
    // to linear light (un-companded) form.
    // ITU-R BT.2020-2 p.4
    const α = 1.09929682680944;
    const β = 0.018053968510807;
    return [r, g, b].map(function (val) {
        let sign = val < 0 ? -1 : 1;
        let abs = Math.abs(val);
        if (abs < β * 4.5) {
            return roundWithPrecision(val / 4.5);
        }
        return roundWithPrecision(sign * (Math.pow((abs + α - 1) / α, 1 / 0.45)));
    });
}

export { cmyk2srgb, gam_sRGB, hex2srgb, hsl2srgb, hsl2srgbvalues, hslvalues, hwb2srgb, lab2srgb, lch2srgb, lin_2020, lin_ProPhoto, lin_a98rgb, oklab2srgb, oklch2srgb, rgb2srgb, sRGB_gam };
