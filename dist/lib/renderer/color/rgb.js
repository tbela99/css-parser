import { getAngle, getNumber, minmax } from './color.js';
import { COLORS_NAMES } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import { expandHexValue } from './hex.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { hwb2srgb, cmyk2srgb, oklab2srgb, oklch2srgb, lab2srgb, lch2srgb } from './srgb.js';
import '../sourcemap/lib/encode.js';

function srgb2rgb(value) {
    return minmax(Math.round(value * 255), 0, 255);
}
function hex2rgb(token) {
    const value = expandHexValue(token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
    const rgb = [];
    for (let i = 1; i < value.length; i += 2) {
        rgb.push(parseInt(value.slice(i, i + 2), 16));
    }
    return rgb;
}
function hwb2rgb(token) {
    return hwb2srgb(token).map(srgb2rgb);
}
function hsl2rgb(token) {
    let { h, s, l, a } = hslvalues(token);
    return hsl2rgbvalues(h, s, l, a);
}
function cmyk2rgb(token) {
    return cmyk2srgb(token).map(srgb2rgb);
}
function oklab2rgb(token) {
    return oklab2srgb(token).map(srgb2rgb);
}
function oklch2rgb(token) {
    return oklch2srgb(token).map(srgb2rgb);
}
function lab2rgb(token) {
    return lab2srgb(token).map(srgb2rgb);
}
function lch2rgb(token) {
    return lch2srgb(token).map(srgb2rgb);
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
function hsl2rgbvalues(h, s, l, a = null) {
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
    const values = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    if (a != null && a != 1) {
        values.push(Math.round(a * 255));
    }
    return values;
}

export { cmyk2rgb, hex2rgb, hsl2rgb, hsl2rgbvalues, hslvalues, hwb2rgb, lab2rgb, lch2rgb, oklab2rgb, oklch2rgb };
