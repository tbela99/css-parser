import { minmax } from './color.js';
import { COLORS_NAMES } from './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import { expandHexValue } from './hex.js';
import { hslvalues, hsl2srgbvalues, hwb2srgb, cmyk2srgb, oklab2srgb, oklch2srgb, lab2srgb, lch2srgb } from './srgb.js';
import '../sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

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
    return hwb2srgb(token)?.map?.(srgb2rgb) ?? null;
}
function hsl2rgb(token) {
    let { h, s, l, a } = hslvalues(token) ?? {};
    if (h == null || s == null || l == null) {
        return null;
    }
    return hsl2srgbvalues(h, s, l, a).map((t) => minmax(Math.round(t * 255), 0, 255));
}
function cmyk2rgb(token) {
    return cmyk2srgb(token)?.map?.(srgb2rgb) ?? null;
}
function oklab2rgb(token) {
    return oklab2srgb(token)?.map?.(srgb2rgb) ?? null;
}
function oklch2rgb(token) {
    return oklch2srgb(token)?.map?.(srgb2rgb) ?? null;
}
function lab2rgb(token) {
    return lab2srgb(token)?.map?.(srgb2rgb) ?? null;
}
function lch2rgb(token) {
    return lch2srgb(token)?.map?.(srgb2rgb) ?? null;
}

export { cmyk2rgb, hex2rgb, hsl2rgb, hwb2rgb, lab2rgb, lch2rgb, oklab2rgb, oklch2rgb, srgb2rgb };
