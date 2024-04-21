import { multiplyMatrices } from './utils/matrix.js';
import './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { xyz2lab } from './lab.js';
import { lab2lchvalues } from './lch.js';
import { XYZ_D50_to_D65 } from './xyz.js';
import '../sourcemap/lib/encode.js';
import '../../parser/utils/type.js';

function xyzd502lch(x, y, z, alpha) {
    // @ts-ignore
    const [l, a, b] = xyz2lab(...XYZ_D50_to_D65(x, y, z));
    // L in range [0,100]. For use in CSS, add a percent
    // @ts-ignore
    return lab2lchvalues(l, a, b, alpha);
}
function XYZ_D65_to_D50(x, y, z) {
    // Bradford chromatic adaptation from D65 to D50
    // The matrix below is the result of three operations:
    // - convert from XYZ to retinal cone domain
    // - scale components from one reference white to another
    // - convert back to XYZ
    // see https://github.com/LeaVerou/color.js/pull/354/files
    var M = [
        [1.0479297925449969, 0.022946870601609652, -0.05019226628920524],
        [0.02962780877005599, 0.9904344267538799, -0.017073799063418826],
        [-0.009243040646204504, 0.015055191490298152, 0.7518742814281371]
    ];
    return multiplyMatrices(M, [x, y, z]);
}

export { XYZ_D65_to_D50, xyzd502lch };
