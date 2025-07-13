import { e, k, D50 } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import { srgb2xyz } from './xyz.js';
import { oklch2srgb, hwb2srgb, hsl2srgb, rgb2srgb, hex2srgb } from './srgb.js';
import { getLCHComponents } from './lch.js';
import { OKLab_to_XYZ, getOKLABComponents } from './oklab.js';
import { getNumber } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { xyzd502srgb } from './xyzd50.js';
import '../sourcemap/lib/encode.js';

// L: 0% = 0.0, 100% = 100.0
// for a and b: -100% = -125, 100% = 125
function hex2lab(token) {
    //  @ts-ignore
    return srgb2lab(...hex2srgb(token));
}
function rgb2lab(token) {
    // @ts-ignore
    return srgb2lab(...rgb2srgb(token));
}
function hsl2lab(token) {
    // @ts-ignore
    return srgb2lab(...hsl2srgb(token));
}
function hwb2lab(token) {
    // @ts-ignore
    return srgb2lab(...hwb2srgb(token));
}
function lch2lab(token) {
    // @ts-ignore
    return lch2labvalues(...getLCHComponents(token));
}
function oklab2lab(token) {
    // @ts-ignore
    return xyz2lab(...OKLab_to_XYZ(...getOKLABComponents(token)));
}
function oklch2lab(token) {
    // @ts-ignore
    return srgb2lab(...oklch2srgb(token));
}
function srgb2lab(r, g, b, a) {
    // @ts-ignore */
    const result = xyz2lab(...srgb2xyz(r, g, b));
    // Fixes achromatic RGB colors having a _slight_ chroma due to floating-point errors
    // and approximated computations in sRGB <-> CIELab.
    // See: https://github.com/d3/d3-color/pull/46
    if (r === b && b === g) {
        result[1] = result[2] = 0;
    }
    if (a != null) {
        result.push(a);
    }
    return result;
}
function xyz2lab(x, y, z, a = null) {
    // Assuming XYZ is relative to D50, convert to CIE Lab
    // from CIE standard, which now defines these as a rational fraction
    // var e = 216/24389;  // 6^3/29^3
    // var k = 24389/27;   // 29^3/3^3
    // compute xyz, which is XYZ scaled relative to reference white
    const xyz = [x, y, z].map((value, i) => value / D50[i]);
    // now compute f
    const f = xyz.map((value) => value > e ? Math.cbrt(value) : (k * value + 16) / 116);
    const result = [
        (116 * f[1]) - 16, // L
        500 * (f[0] - f[1]), // a
        200 * (f[1] - f[2]) // b
    ];
    // L in range [0,100]. For use in CSS, add a percent
    if (a != null && a != 1) {
        result.push(a);
    }
    return result;
}
function lch2labvalues(l, c, h, a = null) {
    // l, c * Math.cos(360 * h * Math.PI / 180), c * Math.sin(360 * h * Math.PI / 180
    const result = [l, c * Math.cos(h * Math.PI / 180), c * Math.sin(h * Math.PI / 180)];
    if (a != null) {
        result.push(a);
    }
    return result;
}
function getLABComponents(token) {
    const components = getComponents(token);
    if (components == null) {
        return null;
    }
    for (let i = 0; i < components.length; i++) {
        if (![EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.AngleTokenType, EnumToken.IdenTokenType].includes(components[i].typ)) {
            return [];
        }
    }
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
    const result = [l, a, b];
    if (alpha != null && alpha != 1) {
        result.push(alpha);
    }
    return result;
}
// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// D50 LAB
function Lab_to_sRGB(l, a, b) {
    // @ts-ignore
    return xyzd502srgb(...Lab_to_XYZ(l, a, b));
}
// from https://www.w3.org/TR/css-color-4/#color-conversion-code
function Lab_to_XYZ(l, a, b) {
    // Convert Lab to D50-adapted XYZ
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
    const k = 24389 / 27; // 29^3/3^3
    const e = 216 / 24389; // 6^3/29^3
    const f = [];
    // compute f, starting with the luminance-related term
    f[1] = (l + 16) / 116;
    f[0] = a / 500 + f[1];
    f[2] = f[1] - b / 200;
    // compute xyz
    const xyz = [
        Math.pow(f[0], 3) > e ? Math.pow(f[0], 3) : (116 * f[0] - 16) / k,
        l > k * e ? Math.pow((l + 16) / 116, 3) : l / k,
        Math.pow(f[2], 3) > e ? Math.pow(f[2], 3) : (116 * f[2] - 16) / k
    ];
    // Compute XYZ by scaling xyz by reference white
    return xyz.map((value, i) => value * D50[i]);
}

export { Lab_to_XYZ, Lab_to_sRGB, getLABComponents, hex2lab, hsl2lab, hwb2lab, lch2lab, lch2labvalues, oklab2lab, oklch2lab, rgb2lab, srgb2lab, xyz2lab };
