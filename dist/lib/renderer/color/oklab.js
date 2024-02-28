import './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { gam_sRGB } from './srgb.js';
import '../sourcemap/lib/encode.js';

// from https://www.w3.org/TR/css-color-4/#color-conversion-code
function OKLab_to_sRGB(l, a, b) {
    // console.error({l, a, b});
    // console.error({l, a, b});
    // @ts-ignore
    // return  XYZ_to_sRGB(...OKLab_to_XYZ(l, a, b));
    let L = Math.pow(l * 0.99999999845051981432 +
        0.39633779217376785678 * a +
        0.21580375806075880339 * b, 3);
    let M = Math.pow(l * 1.0000000088817607767 -
        0.1055613423236563494 * a -
        0.063854174771705903402 * b, 3);
    let S = Math.pow(l * 1.0000000546724109177 -
        0.089484182094965759684 * a -
        1.2914855378640917399 * b, 3);
    return gam_sRGB(
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

export { OKLab_to_sRGB };
