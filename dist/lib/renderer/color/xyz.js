import './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { lsrgb2srgb, srgb2lsrgb } from './srgb.js';
import '../sourcemap/lib/encode.js';

function xyzd502srgb(x, y, z) {
    // @ts-ignore
    return lsrgb2srgb(
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
function srgb2xyz(r, g, b, alpha) {
    [r, g, b] = srgb2lsrgb(r, g, b);
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

export { srgb2xyz, xyzd502srgb };
