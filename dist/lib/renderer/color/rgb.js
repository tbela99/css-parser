import { getNumber, minmax, getAngle } from './color.js';
import { getComponents } from './utils/components.js';
import { OKLab_to_sRGB } from './oklab.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { Lab_to_sRGB } from './lab.js';
import '../sourcemap/lib/encode.js';

function hwb2rgb(token) {
    const { h: hue, s: white, l: black, a: alpha } = hslvalues(token);
    const rgb = hsl2rgbvalues(hue, 1, .5);
    for (let i = 0; i < 3; i++) {
        rgb[i] *= (1 - white - black);
        rgb[i] = Math.round(rgb[i] + white);
    }
    if (alpha != null && alpha != 1) {
        rgb.push(Math.round(255 * alpha));
    }
    return rgb;
}
function hsl2rgb(token) {
    let { h, s, l, a } = hslvalues(token);
    return hsl2rgbvalues(h, s, l, a);
}
function cmyk2rgb(token) {
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
        Math.round(255 * (1 - Math.min(1, c * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, m * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, y * (1 - k) + k)))
    ];
    // @ts-ignore
    if (token.chi.length >= 9) {
        // @ts-ignore
        t = token.chi[8];
        // @ts-ignore
        rgb.push(Math.round(255 * getNumber(t)));
    }
    return rgb;
}
function oklab2rgb(token) {
    const components = getComponents(token);
    // @ts-ignore
    let t = components[0];
    // @ts-ignore
    const l = getNumber(t);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    const a = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? .4 : 1);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    const b = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? .4 : 1);
    // @ts-ignore
    t = components[3];
    // @ts-ignore
    const alpha = t == null ? 1 : getNumber(t);
    const rgb = OKLab_to_sRGB(l, a, b).map(v => {
        return Math.round(255 * v);
    });
    if (alpha != 1) {
        rgb.push(Math.round(255 * alpha));
    }
    return rgb.map(((value) => minmax(value, 0, 255)));
}
function oklch2rgb(token) {
    const components = getComponents(token);
    // @ts-ignore
    let t = components[0];
    // @ts-ignore
    const l = getNumber(t);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    const c = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? .4 : 1);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    const h = getAngle(t);
    // @ts-ignore
    t = components[3];
    // @ts-ignore
    const alpha = t == null ? 1 : getNumber(t);
    // https://www.w3.org/TR/css-color-4/#lab-to-lch
    const rgb = OKLab_to_sRGB(l, c * Math.cos(360 * h * Math.PI / 180), c * Math.sin(360 * h * Math.PI / 180));
    if (alpha != 1) {
        rgb.push(alpha);
    }
    return rgb.map(((value) => minmax(Math.round(255 * value), 0, 255)));
}
function lab2rgb(token) {
    const components = getComponents(token);
    // @ts-ignore
    let t = components[0];
    // @ts-ignore
    const l = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 100 : 1);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    const a = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 125 : 1);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    const b = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 125 : 1);
    // @ts-ignore
    t = components[3];
    // @ts-ignore
    const alpha = t == null ? 1 : getNumber(t);
    const rgb = Lab_to_sRGB(l, a, b);
    //
    if (alpha != 1) {
        rgb.push(alpha);
    }
    return rgb.map(((value) => minmax(Math.round(value * 255), 0, 255)));
}
function lch2rgb(token) {
    const components = getComponents(token);
    // @ts-ignore
    let t = components[0];
    // @ts-ignore
    const l = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 100 : 1);
    // @ts-ignore
    t = components[1];
    // @ts-ignore
    const c = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 150 : 1);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    const h = getAngle(t);
    // @ts-ignore
    t = components[3];
    // @ts-ignore
    const alpha = t == null ? 1 : getNumber(t);
    // https://www.w3.org/TR/css-color-4/#lab-to-lch
    const a = c * Math.cos(360 * h * Math.PI / 180);
    const b = c * Math.sin(360 * h * Math.PI / 180);
    const rgb = Lab_to_sRGB(l, a, b);
    //
    if (alpha != 1) {
        rgb.push(alpha);
    }
    return rgb.map(((value) => minmax(value * 255, 0, 255)));
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

export { cmyk2rgb, hsl2rgb, hsl2rgbvalues, hslvalues, hwb2rgb, lab2rgb, lch2rgb, oklab2rgb, oklch2rgb };
