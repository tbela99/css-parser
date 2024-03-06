import { xyz2srgb, srgb2lsrgb } from './srgb.js';
import { multiplyMatrices } from './utils/matrix.js';
import './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import '../sourcemap/lib/encode.js';

function p32srgb(r, g, b, alpha) {
    // @ts-ignore
    return xyz2srgb(...lp32xyz(...p32lp3(r, g, b, alpha)));
}
function p32lp3(r, g, b, alpha) {
    // convert an array of display-p3 RGB values in the range 0.0 - 1.0
    // to linear light (un-companded) form.
    return srgb2lsrgb(r, g, b, alpha); // same as sRGB
}
function lp32xyz(r, g, b, alpha) {
    // convert an array of linear-light display-p3 values to CIE XYZ
    // using  D65 (no chromatic adaptation)
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
    const M = [
        [608311 / 1250200, 189793 / 714400, 198249 / 1000160],
        [35783 / 156275, 247089 / 357200, 198249 / 2500400],
        [0 / 1, 32229 / 714400, 5220557 / 5000800],
    ];
    const result = multiplyMatrices(M, [r, g, b]);
    if (alpha != null && alpha != 1) {
        result.push(alpha);
    }
    return result;
}

export { lp32xyz, p32lp3, p32srgb };
