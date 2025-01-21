import { multiplyMatrices } from './utils/matrix.js';
import './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import { lsrgb2srgbvalues, srgb2lsrgbvalues } from './srgb.js';
import '../sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

function xyzd502srgb(x, y, z) {
    // @ts-ignore
    return lsrgb2srgbvalues(
    /* r: */
    x * 3.1341359569958707 -
        y * 1.6173863321612538 -
        0.4906619460083532 * z, 
    /*  g: */
    x * -0.978795502912089 +
        y * 1.916254567259524 +
        0.03344273116131949 * z, 
    /*    b: */
    x * 0.07195537988411677 -
        y * 0.2289768264158322 +
        1.405386058324125 * z);
}
function XYZ_to_lin_sRGB(x, y, z) {
    // convert XYZ to linear-light sRGB
    const M = [
        [12831 / 3959, -329 / 214, -1974 / 3959],
        [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
        [705 / 12673, -2585 / 12673, 705 / 667],
    ];
    const XYZ = [x, y, z]; // convert to XYZ
    return multiplyMatrices(M, XYZ).map((v) => v);
}
function XYZ_D50_to_D65(x, y, z) {
    // Bradford chromatic adaptation from D50 to D65
    const M = [
        [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
        [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
        [0.012314001688319899, -0.020507696433477912, 1.3303659366080753]
    ];
    const XYZ = [x, y, z];
    return multiplyMatrices(M, XYZ); //.map((v: number) => v);
}
function srgb2xyz(r, g, b, alpha) {
    [r, g, b] = srgb2lsrgbvalues(r, g, b);
    const rgb = [
        0.436065742824811 * r +
            0.3851514688337912 * g +
            0.14307845442264197 * b,
        0.22249319175623702 * r +
            0.7168870538238823 * g +
            0.06061979053616537 * b,
        0.013923904500943465 * r +
            0.09708128566574634 * g +
            0.7140993584005155 * b
    ];
    if (alpha != null && alpha != 1) {
        rgb.push(alpha);
    }
    return rgb;
}

export { XYZ_D50_to_D65, XYZ_to_lin_sRGB, srgb2xyz, xyzd502srgb };
