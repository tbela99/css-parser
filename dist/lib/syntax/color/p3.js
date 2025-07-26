import { xyz2srgb, lsrgb2srgbvalues, srgb2lsrgbvalues } from './srgb.js';
import { multiplyMatrices } from './utils/matrix.js';
import './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { srgb2xyz } from './xyz.js';
import '../../renderer/sourcemap/lib/encode.js';

function p32srgbvalues(r, g, b, alpha) {
    // @ts-ignore
    return xyz2srgb(...lp32xyz(...p32lp3(r, g, b, alpha)));
}
function srgb2p3values(r, g, b, alpha) {
    // @ts-ignore
    return srgb2xyz(...xyz2lp3(...lp32p3(r, g, b, alpha)));
}
function p32lp3(r, g, b, alpha) {
    // convert an array of display-p3 RGB values in the range 0.0 - 1.0
    // to linear light (un-companded) form.
    return srgb2lsrgbvalues(r, g, b, alpha); // same as sRGB
}
function lp32p3(r, g, b, alpha) {
    // convert an array of linear-light display-p3 RGB  in the range 0.0-1.0
    // to gamma corrected form
    return lsrgb2srgbvalues(r, g, b, alpha); // same as sRGB
}
function lp32xyz(r, g, b, alpha) {
    // convert an array of linear-light display-p3 values to CIE XYZ
    // using  D65 (no chromatic adaptation)
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
    const M = [
        [608311 / 1250200, 189793 / 714400, 198249 / 1000160],
        [35783 / 156275, 247089 / 357200, 198249 / 2500400],
        [0, 32229 / 714400, 5220557 / 5000800],
    ];
    const result = multiplyMatrices(M, [r, g, b]);
    if (alpha != null && alpha != 1) {
        result.push(alpha);
    }
    return result;
}
function xyz2lp3(x, y, z, alpha) {
    // convert XYZ to linear-light P3
    const M = [
        [446124 / 178915, -333277 / 357830, -72051 / 178915],
        [-14852 / 17905, 63121 / 35810, 423 / 17905],
        [11844 / 330415, -50337 / 660830, 316169 / 330415],
    ];
    const result = multiplyMatrices(M, [x, y, z]);
    if (alpha != null && alpha != 1) {
        result.push(alpha);
    }
    return result;
}

export { lp32p3, lp32xyz, p32lp3, p32srgbvalues, srgb2p3values, xyz2lp3 };
