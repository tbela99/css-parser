/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 1.6.9
	License: MIT
 */
import { getColorComponents } from './utils/components.js';
import { color2srgbvalues, getNumber, getAngle } from './color.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import { Lab_to_sRGB, getLABComponents, lchvalues2labvalues } from './lab.js';
import { expandHexValue } from './hex.js';
import { OKLab_to_sRGB, getOKLABComponents } from './oklab.js';
import { getLCHComponents } from './lch.js';
import { getOKLCHComponents } from './oklch.js';
import { XYZ_to_lin_sRGB } from './xyz.js';
import { COLORS_NAMES } from '../constants.js';
import { parseColor } from '../syntax.js';
import { hwbvalues } from './hwb.js';

// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// srgb-linear -> srgb
// 0 <= r, g, b <= 1
function srgbvalues(token) {
    if (token.typ === EnumToken.IdenTokenType) {
        token = parseColor(token);
    }
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
function rgb2srgb(token) {
    return (getColorComponents(token)?.map?.((t, index) => index == 3
        ? t.typ == EnumToken.IdenTokenType && t.val == "none"
            ? 1
            : getNumber(t)
        : ((t.typ == EnumToken.PercentageTokenType ? 255 : 1) *
            getNumber(t)) /
            255) ?? null);
}
function rgb2srgbvalues(token) {
    return (getColorComponents(token)?.map?.((t, index) => index == 3
        ? getNumber(t)
        : getNumber(t) / 255) ?? null);
}
// export function rgbvalues2srgbvalues(r: number, g: number, b: number, a: number | null = null): number[] | null {
//     const result = [r / 255, g / 255, b / 255];
//
//     if (a != null && a != 1) {
//         result.push(a);
//     }
//
//     return result;
// }
function hex2srgbvalues(token) {
    const value = expandHexValue(token.kin == ColorType.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
    const rgb = [];
    for (let i = 1; i < value.length; i += 2) {
        rgb.push(parseInt(value.slice(i, i + 2), 16) / 255);
    }
    if (rgb.length == 4) {
        rgb[3] = +rgb[3].toFixed(2);
    }
    return rgb;
}
// xyz d65 input
function xyz2srgb(x, y, z, alpha = null) {
    let values = XYZ_to_lin_sRGB(x, y, z);
    // @ts-ignore
    return lsrgb2srgbvalues(values[0], values[1], values[2], alpha);
}
function hwb2srgbvalues(token) {
    const { h, w, b, a } = hwbvalues(token) ?? {};
    if (h == null || w == null || b == null) {
        return [];
    }
    const rgb = hwb2srgb(h, w, b);
    if (a != null && a != 1) {
        rgb.push(a);
    }
    return rgb;
}
/**
 * convert hwb to sRGB
 */
function hwb2srgb(h, w, b, alpha) {
    const wNorm = w / 100;
    const bNorm = b / 100;
    if (wNorm + bNorm >= 1) {
        const gray = wNorm / (wNorm + bNorm);
        return [Math.round(gray * 10000) / 10000, Math.round(gray * 10000) / 10000, Math.round(gray * 10000) / 10000];
    }
    const hPrime = (h % 360) / 60;
    const x = 1 - Math.abs((hPrime % 2) - 1);
    let rChroma = 0;
    let gChroma = 0;
    let bChroma = 0;
    if (hPrime >= 0 && hPrime < 1) {
        [rChroma, gChroma, bChroma] = [1, x, 0];
    }
    else if (hPrime >= 1 && hPrime < 2) {
        [rChroma, gChroma, bChroma] = [x, 1, 0];
    }
    else if (hPrime >= 2 && hPrime < 3) {
        [rChroma, gChroma, bChroma] = [0, 1, x];
    }
    else if (hPrime >= 3 && hPrime < 4) {
        [rChroma, gChroma, bChroma] = [0, x, 1];
    }
    else if (hPrime >= 4 && hPrime < 5) {
        [rChroma, gChroma, bChroma] = [x, 0, 1];
    }
    else if (hPrime >= 5 && hPrime <= 6) {
        [rChroma, gChroma, bChroma] = [1, 0, x];
    }
    const factor = 1 - wNorm - bNorm;
    const srgb = [rChroma * factor + wNorm, gChroma * factor + wNorm, bChroma * factor + wNorm];
    return srgb;
}
function hsl2srgb(token) {
    let { h, s, l, a } = hslvalues(token) ?? {};
    if (h == null || s == null || l == null) {
        return null;
    }
    // hue in degrees
    return hslvalues2srgbvalues(h, s, l, a);
}
function cmyk2srgbvalues(token) {
    const components = getColorComponents(token);
    if (components == null) {
        return null;
    }
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
    const mul = 1 - k;
    const rgb = [1 - Math.min(1, c * mul + k), 1 - Math.min(1, m * mul + k), 1 - Math.min(1, y * mul + k)];
    if (components.length == 5) {
        rgb.push(getNumber(components[4]));
    }
    return rgb;
}
function oklab2srgbvalues(token) {
    const [l, a, b, alpha] = getOKLABComponents(token) ?? [];
    if (l == null || a == null || b == null) {
        return null;
    }
    const rgb = OKLab_to_sRGB(l, a, b);
    if (alpha != null && alpha != 1) {
        rgb.push(alpha);
    }
    return rgb;
}
function oklch2srgbvalues(token) {
    const [l, c, h, alpha] = getOKLCHComponents(token) ?? [];
    if (l == null || c == null || h == null) {
        return null;
    }
    const values = lchvalues2labvalues(l, c, h);
    const rgb = OKLab_to_sRGB(values[0], values[1], values[2]);
    if (alpha != 1) {
        rgb.push(alpha);
    }
    return rgb;
}
function hslvalues(token) {
    const components = getColorComponents(token);
    if (components == null) {
        return null;
    }
    let t;
    // @ts-ignore
    let h = getAngle(components[0]) * 360;
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    let s = getNumber(t);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    let l = getNumber(t);
    if (components[1].typ == EnumToken.PercentageTokenType) {
        s *= 100;
    }
    if (components[2].typ == EnumToken.PercentageTokenType) {
        l *= 100;
    }
    let a = null;
    if (components.length == 4) {
        // @ts-ignore
        t = components[3];
        // @ts-ignore
        a = getNumber(t);
    }
    return a == null ? { h, s, l } : { h, s, l, a };
}
function hslvalues2srgbvalues(h, s, l, a = null) {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const chroma = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const hPrime = h / 60;
    const x = chroma * (1 - Math.abs((hPrime % 2) - 1));
    let rTmp = 0;
    let gTmp = 0;
    let bTmp = 0;
    if (hPrime >= 0 && hPrime < 1) {
        [rTmp, gTmp, bTmp] = [chroma, x, 0];
    }
    else if (hPrime >= 1 && hPrime < 2) {
        [rTmp, gTmp, bTmp] = [x, chroma, 0];
    }
    else if (hPrime >= 2 && hPrime < 3) {
        [rTmp, gTmp, bTmp] = [0, chroma, x];
    }
    else if (hPrime >= 3 && hPrime < 4) {
        [rTmp, gTmp, bTmp] = [0, x, chroma];
    }
    else if (hPrime >= 4 && hPrime < 5) {
        [rTmp, gTmp, bTmp] = [x, 0, chroma];
    }
    else if (hPrime >= 5 && hPrime <= 6) {
        [rTmp, gTmp, bTmp] = [chroma, 0, x];
    }
    const m = lNorm - chroma / 2;
    const values = [rTmp + m, gTmp + m, bTmp + m];
    if (a != null) {
        values.push(a);
    }
    // Return exact float decimals instead of multiplying by 255
    return values;
}
function lab2srgbvalues(token) {
    const [l, a, b, alpha] = getLABComponents(token) ?? [];
    if (l == null || a == null || b == null) {
        return null;
    }
    const rgb = Lab_to_sRGB(l, a, b);
    if (alpha != null && alpha < 1) {
        rgb.push(alpha);
    }
    return rgb;
}
function lch2srgbvalues(token) {
    const components = getLCHComponents(token);
    if (components == null) {
        return null;
    }
    // @ts-ignore
    const [l, a, b, alpha] = lchvalues2labvalues(components[0], components[1], components[2], components[3]);
    if (l == null || a == null || b == null) {
        return null;
    }
    // https://www.w3.org/TR/css-color-4/#lab-to-lch
    const rgb = Lab_to_sRGB(l, a, b);
    if (alpha != 1) {
        rgb.push(alpha);
    }
    return rgb;
}
// sRGB -> lRGB
function srgb2lsrgbvalues(r, g, b, a = null) {
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
function lsrgb2srgbvalues(r, g, b, alpha = null) {
    // convert an array of linear-light sRGB values in the range 0.0-1.0
    // to gamma corrected form
    // https://en.wikipedia.org/wiki/SRGB
    // Extended transfer function:
    // For negative values, linear portion extends on reflection
    // of axis, then uses reflected pow below that
    const rgb = [r, g, b].map((val) => {
        let abs = Math.abs(val);
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

export { cmyk2srgbvalues, hex2srgbvalues, hsl2srgb, hslvalues, hslvalues2srgbvalues, hwb2srgb, hwb2srgbvalues, lab2srgbvalues, lch2srgbvalues, lsrgb2srgbvalues, oklab2srgbvalues, oklch2srgbvalues, rgb2srgb, rgb2srgbvalues, srgb2lsrgbvalues, srgbvalues, xyz2srgb };
