import { D50 } from './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { XYZ_to_sRGB } from './xyz.js';
import '../sourcemap/lib/encode.js';

// L: 0% = 0.0, 100% = 100.0
// for a and b: -100% = -125, 100% = 125
// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// D50 LAB
function Lab_to_sRGB(l, a, b) {
    // @ts-ignore
    return XYZ_to_sRGB(...Lab_to_XYZ(l, a, b));
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

export { Lab_to_XYZ, Lab_to_sRGB };
