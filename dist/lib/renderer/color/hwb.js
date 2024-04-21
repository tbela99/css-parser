import { hsl2hsv } from './hsv.js';
import './utils/constants.js';
import { getComponents } from './utils/components.js';
import { getNumber, getAngle } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { lab2srgb, lch2srgb, oklab2srgb, oklch2srgb } from './srgb.js';
import { eq } from '../../parser/utils/eq.js';
import '../sourcemap/lib/encode.js';
import '../../parser/utils/type.js';

function rgb2hwb(token) {
    // @ts-ignore
    return srgb2hwb(...getComponents(token).map((t, index) => {
        if (index == 3 && eq(t, { typ: EnumToken.IdenTokenType, val: 'none' })) {
            return 1;
        }
        return getNumber(t) / 255;
    }));
}
function hsl2hwb(token) {
    // @ts-ignore
    return hsl2hwbvalues(...getComponents(token).map((t, index) => {
        if (index == 3 && eq(t, { typ: EnumToken.IdenTokenType, val: 'none' })) {
            return 1;
        }
        if (index == 0) {
            return getAngle(t);
        }
        return getNumber(t);
    }));
}
function lab2hwb(token) {
    // @ts-ignore
    return srgb2hwb(...lab2srgb(token));
}
function lch2hwb(token) {
    // @ts-ignore
    return srgb2hwb(...lch2srgb(token));
}
function oklab2hwb(token) {
    // @ts-ignore
    return srgb2hwb(...oklab2srgb(token));
}
function oklch2hwb(token) {
    // @ts-ignore
    return srgb2hwb(...oklch2srgb(token));
}
function rgb2hue(r, g, b, fallback = 0) {
    let value = rgb2value(r, g, b);
    let whiteness = rgb2whiteness(r, g, b);
    let delta = value - whiteness;
    if (delta > 0) {
        // calculate segment
        let segment = value === r ? (g - b) / delta : (value === g
            ? (b - r) / delta
            : (r - g) / delta);
        // calculate shift
        let shift = value === r ? segment < 0
            ? 360 / 60
            : 0 / 60 : (value === g
            ? 120 / 60
            : 240 / 60);
        // calculate hue
        return (segment + shift) * 60;
    }
    return fallback;
}
function rgb2value(r, g, b) {
    return Math.max(r, g, b);
}
function rgb2whiteness(r, g, b) {
    return Math.min(r, g, b);
}
function srgb2hwb(r, g, b, a = null, fallback = 0) {
    r *= 100;
    g *= 100;
    b *= 100;
    let hue = rgb2hue(r, g, b, fallback);
    let whiteness = rgb2whiteness(r, g, b);
    let value = Math.round(rgb2value(r, g, b));
    let blackness = 100 - value;
    const result = [hue / 360, whiteness / 100, blackness / 100];
    if (a != null) {
        result.push(a);
    }
    return result;
}
function hsv2hwb(h, s, v, a = null) {
    const result = [h, (1 - s) * v, 1 - v];
    if (a != null) {
        result.push(a);
    }
    return result;
}
function hsl2hwbvalues(h, s, l, a = null) {
    // @ts-ignore
    return hsv2hwb(...hsl2hsv(h, s, l, a));
}

export { hsl2hwb, hsl2hwbvalues, hsv2hwb, lab2hwb, lch2hwb, oklab2hwb, oklch2hwb, rgb2hwb, srgb2hwb };
