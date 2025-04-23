import { COLORS_NAMES } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import { color2srgbvalues, getNumber, getAngle } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import { expandHexValue } from './hex.js';
import { lch2labvalues, Lab_to_sRGB, getLABComponents } from './lab.js';
import { OKLab_to_sRGB, getOKLABComponents } from './oklab.js';
import { getLCHComponents } from './lch.js';
import { getOKLCHComponents } from './oklch.js';
import { XYZ_to_lin_sRGB } from './xyz.js';
import '../sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// srgb-linear -> srgb
// 0 <= r, g, b <= 1
function srgbvalues(token) {
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
function rgb2srgb(token) {
    return getComponents(token)?.map?.((t, index) => index == 3 ? ((t.typ == EnumToken.IdenTokenType && t.val == 'none') ? 1 : getNumber(t)) : (t.typ == EnumToken.PercentageTokenType ? 255 : 1) * getNumber(t) / 255) ?? null;
}
function hex2srgb(token) {
    const value = expandHexValue(token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
    const rgb = [];
    for (let i = 1; i < value.length; i += 2) {
        rgb.push(parseInt(value.slice(i, i + 2), 16) / 255);
    }
    return rgb;
}
function xyz2srgb(x, y, z) {
    // @ts-ignore
    return lsrgb2srgbvalues(...XYZ_to_lin_sRGB(x, y, z));
}
function hwb2srgb(token) {
    const { h: hue, s: white, l: black, a: alpha } = hslvalues(token) ?? {};
    if (hue == null || white == null || black == null) {
        return [];
    }
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
    let { h, s, l, a } = hslvalues(token) ?? {};
    if (h == null || s == null || l == null) {
        return null;
    }
    return hsl2srgbvalues(h, s, l, a);
}
function cmyk2srgb(token) {
    const components = getComponents(token);
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
function oklch2srgb(token) {
    const [l, c, h, alpha] = getOKLCHComponents(token) ?? [];
    if (l == null || c == null || h == null) {
        return null;
    }
    // @ts-ignore
    const rgb = OKLab_to_sRGB(...lch2labvalues(l, c, h));
    if (alpha != 1) {
        rgb.push(alpha);
    }
    return rgb;
}
function hslvalues(token) {
    const components = getComponents(token);
    if (components == null) {
        return null;
    }
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
        a = getNumber(t);
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
    if (l == null || a == null || b == null) {
        return null;
    }
    const rgb = Lab_to_sRGB(l, a, b);
    if (alpha != null && alpha != 1) {
        rgb.push(alpha);
    }
    return rgb;
}
function lch2srgb(token) {
    // @ts-ignore
    const [l, a, b, alpha] = lch2labvalues(...getLCHComponents(token));
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
function lsrgb2srgbvalues(r, g, b, alpha) {
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

export { cmyk2srgb, hex2srgb, hsl2srgb, hsl2srgbvalues, hslvalues, hwb2srgb, lab2srgb, lch2srgb, lsrgb2srgbvalues, oklab2srgb, oklch2srgb, rgb2srgb, srgb2lsrgbvalues, srgbvalues, xyz2srgb };
