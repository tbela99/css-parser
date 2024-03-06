import './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { lsrgb2srgb } from './srgb.js';
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

export { xyzd502srgb };
