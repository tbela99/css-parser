import { xyz2srgb } from './srgb.js';
import { multiplyMatrices } from './utils/matrix.js';
import './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { srgb2xyz } from './xyz.js';
import '../sourcemap/lib/encode.js';
import '../../parser/utils/type.js';

function rec20202srgb(r, g, b, a) {
    // @ts-ignore
    return xyz2srgb(...lrec20202xyz(...rec20202lrec2020(r, g, b)), a);
}
function srgb2rec2020values(r, g, b, a) {
    // @ts-ignore
    return lrec20202rec2020(...xyz2lrec2020(...srgb2xyz(r, g, b)), a);
}
function rec20202lrec2020(r, g, b, a) {
    // convert an array of rec2020 RGB values in the range 0.0 - 1.0
    // to linear light (un-companded) form.
    // ITU-R BT.2020-2 p.4
    const α = 1.09929682680944;
    const β = 0.018053968510807;
    return [r, g, b].map(function (val) {
        let sign = val < 0 ? -1 : 1;
        let abs = Math.abs(val);
        if (abs < β * 4.5) {
            return val / 4.5;
        }
        return sign * (Math.pow((abs + α - 1) / α, 1 / 0.45));
    }).concat(a == null || a == 1 ? [] : [a]);
}
function lrec20202rec2020(r, g, b, a) {
    // convert an array of linear-light rec2020 RGB  in the range 0.0-1.0
    // to gamma corrected form
    // ITU-R BT.2020-2 p.4
    const α = 1.09929682680944;
    const β = 0.018053968510807;
    return [r, g, b].map(function (val) {
        let sign = val < 0 ? -1 : 1;
        let abs = Math.abs(val);
        if (abs > β) {
            return sign * (α * Math.pow(abs, 0.45) - (α - 1));
        }
        return 4.5 * val;
    }).concat(a == null || a == 1 ? [] : [a]);
}
function lrec20202xyz(r, g, b, a) {
    // convert an array of linear-light rec2020 values to CIE XYZ
    // using  D65 (no chromatic adaptation)
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
    var M = [
        [63426534 / 99577255, 20160776 / 139408157, 47086771 / 278816314],
        [26158966 / 99577255, 472592308 / 697040785, 8267143 / 139408157],
        [0, 19567812 / 697040785, 295819943 / 278816314],
    ];
    // 0 is actually calculated as  4.994106574466076e-17
    return multiplyMatrices(M, [r, g, b]).concat(a == null || a == 1 ? [] : [a]);
}
function xyz2lrec2020(x, y, z, a) {
    // convert XYZ to linear-light rec2020
    var M = [
        [30757411 / 17917100, -6372589 / 17917100, -4539589 / 17917100],
        [-19765991 / 29648200, 47925759 / 29648200, 467509 / 29648200],
        [792561 / 44930125, -1921689 / 44930125, 42328811 / 44930125],
    ];
    return multiplyMatrices(M, [x, y, z]).concat(a == null || a == 1 ? [] : [a]);
}

export { rec20202srgb, srgb2rec2020values };
