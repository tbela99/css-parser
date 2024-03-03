import './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { sRGB_gam, gam_sRGB } from './srgb.js';
import '../sourcemap/lib/encode.js';

function srgb2xyz(r, g, b) {
    [r, g, b] = gam_sRGB(r, g, b);
    return [
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
}
function XYZ_to_sRGB(x, y, z) {
    // @ts-ignore
    return sRGB_gam(
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

export { XYZ_to_sRGB, srgb2xyz };
