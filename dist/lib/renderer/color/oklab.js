import { multiplyMatrices } from './utils/matrix.js';
import './utils/constants.js';
import { getComponents } from './utils/components.js';
import { srgb2lsrgbvalues, hex2srgb, rgb2srgb, hsl2srgb, hwb2srgb, lab2srgb, lch2srgb, lsrgb2srgbvalues } from './srgb.js';
import { getNumber } from './color.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { lch2labvalues } from './lab.js';
import { getOKLCHComponents } from './oklch.js';
import '../sourcemap/lib/encode.js';

function hex2oklab(token) {
    // @ts-ignore
    return srgb2oklab(...hex2srgb(token));
}
function rgb2oklab(token) {
    // @ts-ignore
    return srgb2oklab(...rgb2srgb(token));
}
function hsl2oklab(token) {
    // @ts-ignore
    return srgb2oklab(...hsl2srgb(token));
}
function hwb2oklab(token) {
    // @ts-ignore
    return srgb2oklab(...hwb2srgb(token));
}
function lab2oklab(token) {
    // @ts-ignore
    return srgb2oklab(...lab2srgb(token));
}
function lch2oklab(token) {
    // @ts-ignore
    return srgb2oklab(...lch2srgb(token));
}
function oklch2oklab(token) {
    // @ts-ignore
    return lch2labvalues(...getOKLCHComponents(token));
}
function srgb2oklab(r, g, blue, alpha) {
    [r, g, blue] = srgb2lsrgbvalues(r, g, blue);
    let L = Math.cbrt(0.41222147079999993 * r + 0.5363325363 * g + 0.0514459929 * blue);
    let M = Math.cbrt(0.2119034981999999 * r + 0.6806995450999999 * g + 0.1073969566 * blue);
    let S = Math.cbrt(0.08830246189999998 * r + 0.2817188376 * g + 0.6299787005000002 * blue);
    const l = 0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S;
    const a = r == g && g == blue ? 0 : 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S;
    const b = r == g && g == blue ? 0 : 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S;
    return alpha == null ? [l, a, b] : [l, a, b, alpha];
}
function getOKLABComponents(token) {
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
    const alpha = t == null || (t.typ == EnumToken.IdenTokenType && t.val == 'none') ? 1 : getNumber(t);
    const rgb = [l, a, b];
    if (alpha != 1 && alpha != null) {
        rgb.push(alpha);
    }
    return rgb;
}
function OKLab_to_XYZ(l, a, b, alpha = null) {
    // Given OKLab, convert to XYZ relative to D65
    const LMStoXYZ = [
        [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
        [-0.0405757452148008, 1.1122868032803170, -0.0717110580655164],
        [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
    ];
    const OKLabtoLMS = [
        [1.0000000000000000, 0.3963377773761749, 0.2158037573099136],
        [1.0000000000000000, -0.1055613458156586, -0.0638541728258133],
        [1.0000000000000000, -0.0894841775298119, -1.2914855480194092]
    ];
    const LMSnl = multiplyMatrices(OKLabtoLMS, [l, a, b]);
    const xyz = multiplyMatrices(LMStoXYZ, LMSnl.map((c) => c ** 3));
    if (alpha != null) {
        xyz.push(alpha);
    }
    return xyz;
}
// from https://www.w3.org/TR/css-color-4/#color-conversion-code
function OKLab_to_sRGB(l, a, b) {
    let L = Math.pow(l * 0.99999999845051981432 +
        0.39633779217376785678 * a +
        0.21580375806075880339 * b, 3);
    let M = Math.pow(l * 1.0000000088817607767 -
        0.1055613423236563494 * a -
        0.063854174771705903402 * b, 3);
    let S = Math.pow(l * 1.0000000546724109177 -
        0.089484182094965759684 * a -
        1.2914855378640917399 * b, 3);
    return lsrgb2srgbvalues(
    /* r: */
    +4.076741661347994 * L -
        3.307711590408193 * M +
        0.230969928729428 * S, 
    /*  g: */
    -1.2684380040921763 * L +
        2.6097574006633715 * M -
        0.3413193963102197 * S, 
    /*  b: */
    -0.004196086541837188 * L -
        0.7034186144594493 * M +
        1.7076147009309444 * S);
}

export { OKLab_to_XYZ, OKLab_to_sRGB, getOKLABComponents, hex2oklab, hsl2oklab, hwb2oklab, lab2oklab, lch2oklab, oklch2oklab, rgb2oklab, srgb2oklab };
