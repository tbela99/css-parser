import { e, k, D50 } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import { color2srgbvalues, getNumber } from './color.js';
import { getOKLABComponents, OKLab_to_XYZ } from './oklab.js';
import { EnumToken, ColorType } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { oklch2srgbvalues, cmyk2srgbvalues, hwb2srgbvalues, hsl2srgb, rgb2srgb, hex2srgbvalues } from './srgb.js';
import { getLCHComponents } from './lch.js';
import { srgb2xyz_d50, XYZ_D50_to_D65, XYZ_to_lin_sRGB } from './xyz.js';
import { XYZ_D65_to_D50, xyzd502srgb } from './xyzd50.js';
import '../../renderer/sourcemap/lib/encode.js';

function hex2labToken(token) {
    return labToken(hex2labvalues(token));
}
function rgb2labToken(token) {
    const values = rgb2labvalues(token);
    if (values == null) {
        return null;
    }
    return labToken(values);
}
function hsl2labToken(token) {
    const values = hsl2labvalues(token);
    if (values == null) {
        return null;
    }
    return labToken(values);
}
function hwb2labToken(token) {
    const values = hwb2labvalues(token);
    if (values == null) {
        return null;
    }
    return labToken(values);
}
function cmyk2labToken(token) {
    const values = cmyk2labvalues(token);
    if (values == null) {
        return null;
    }
    return labToken(values);
}
function lch2labToken(token) {
    const values = lch2labvalues(token);
    if (values == null) {
        return null;
    }
    return labToken(values);
}
function oklab2labToken(token) {
    const values = oklab2labvalues(token);
    if (values == null) {
        return null;
    }
    return labToken(values);
}
function oklch2labToken(token) {
    const values = oklch2labvalues(token);
    if (values == null) {
        return null;
    }
    return labToken(values);
}
function color2labToken(token) {
    const values = color2labvalues(token);
    if (values == null) {
        return null;
    }
    return labToken(values);
}
function labToken(values) {
    const chi = [
        { typ: EnumToken.NumberTokenType, val: String(values[0]) },
        { typ: EnumToken.NumberTokenType, val: String(values[1]) },
        { typ: EnumToken.NumberTokenType, val: String(values[2]) },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.LiteralTokenType, val: '/' }, { typ: EnumToken.PercentageTokenType, val: (values[3] * 100).toFixed() });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: 'lab',
        chi,
        kin: ColorType.LAB
    };
}
// L: 0% = 0.0, 100% = 100.0
// for a and b: -100% = -125, 100% = 125
function hex2labvalues(token) {
    // @ts-ignore
    return srgb2labvalues(...hex2srgbvalues(token));
}
function rgb2labvalues(token) {
    const values = rgb2srgb(token);
    // @ts-ignore
    return values == null ? null : srgb2labvalues(...values);
}
function cmyk2labvalues(token) {
    const values = cmyk2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2labvalues(...values);
}
function hsl2labvalues(token) {
    const values = hsl2srgb(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2labvalues(...values);
}
function hwb2labvalues(token) {
    // @ts-ignore
    return srgb2labvalues(...hwb2srgbvalues(token));
}
function lch2labvalues(token) {
    const values = getLCHComponents(token);
    // @ts-ignore
    return values == null ? null : lchvalues2labvalues(...values);
}
function oklab2labvalues(token) {
    const values = getOKLABComponents(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return xyz2lab(...XYZ_D65_to_D50(...OKLab_to_XYZ(...values)));
}
function oklch2labvalues(token) {
    const values = oklch2srgbvalues(token);
    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2labvalues(...values);
}
function color2labvalues(token) {
    const val = color2srgbvalues(token);
    if (val == null) {
        return null;
    }
    // @ts-ignore
    return srgb2labvalues(...val);
}
function srgb2labvalues(r, g, b, a) {
    // @ts-ignore */
    const result = xyz2lab(...srgb2xyz_d50(r, g, b));
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
function lchvalues2labvalues(l, c, h, a = null) {
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
    const xyz_d50 = Lab_to_XYZ(l, a, b);
    // @ts-ignore
    const xyz_d65 = XYZ_D50_to_D65(...xyz_d50);
    // @ts-ignore
    const lin_srgb = XYZ_to_lin_sRGB(...xyz_d65);
    lin_srgb.map((value, i) => value > 0.0031308 ? 1.055 * Math.pow(value, 1 / 2.4) - 0.055 : 12.92 * value);
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

export { Lab_to_XYZ, Lab_to_sRGB, cmyk2labToken, cmyk2labvalues, color2labToken, color2labvalues, getLABComponents, hex2labToken, hex2labvalues, hsl2labToken, hsl2labvalues, hwb2labToken, hwb2labvalues, lch2labToken, lch2labvalues, lchvalues2labvalues, oklab2labToken, oklab2labvalues, oklch2labToken, oklch2labvalues, rgb2labToken, rgb2labvalues, srgb2labvalues, xyz2lab };
