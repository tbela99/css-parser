import { xyz2srgb } from './srgb.js';
import { multiplyMatrices } from './utils/matrix.js';
import './utils/constants.js';
import '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { srgb2xyz } from './xyz.js';
import '../sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

function a98rgb2srgbvalues(r, g, b, a = null) {
    //  @ts-ignore
    return xyz2srgb(...la98rgb2xyz(...a98rgb2la98(r, g, b, a)));
}
function srgb2a98values(r, g, b, a = null) {
    // @ts-ignore
    return la98rgb2a98rgb(xyz2la98rgb(...srgb2xyz(r, g, b, a)));
}
// a98-rgb functions
function a98rgb2la98(r, g, b, a = null) {
    // convert an array of a98-rgb values in the range 0.0 - 1.0
    // to linear light (un-companded) form.
    // negative values are also now accepted
    return [r, g, b].map(function (val) {
        let sign = val < 0 ? -1 : 1;
        let abs = Math.abs(val);
        return sign * Math.pow(abs, 563 / 256);
    }).concat(a == null || a == 1 ? [] : [a]);
}
function la98rgb2a98rgb(r, g, b, a = null) {
    // convert an array of linear-light a98-rgb  in the range 0.0-1.0
    // to gamma corrected form
    // negative values are also now accepted
    return [r, b, g].map(function (val) {
        let sign = val < 0 ? -1 : 1;
        let abs = Math.abs(val);
        return sign * Math.pow(abs, 256 / 563);
    }).concat(a == null || a == 1 ? [] : [a]);
}
function la98rgb2xyz(r, g, b, a = null) {
    // convert an array of linear-light a98-rgb values to CIE XYZ
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
    // has greater numerical precision than section 4.3.5.3 of
    // https://www.adobe.com/digitalimag/pdfs/AdobeRGB1998.pdf
    // but the values below were calculated from first principles
    // from the chromaticity coordinates of R G B W
    // see matrixmaker.html
    var M = [
        [573536 / 994567, 263643 / 1420810, 187206 / 994567],
        [591459 / 1989134, 6239551 / 9945670, 374412 / 4972835],
        [53769 / 1989134, 351524 / 4972835, 4929758 / 4972835],
    ];
    return multiplyMatrices(M, [r, g, b]).concat(a == null || a == 1 ? [] : [a]);
}
function xyz2la98rgb(x, y, z, a = null) {
    // convert XYZ to linear-light a98-rgb
    var M = [
        [1829569 / 896150, -506331 / 896150, -308931 / 896150],
        [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
        [16779 / 1248040, -147721 / 1248040, 1266979 / 1248040],
    ];
    return multiplyMatrices(M, [x, y, z]).concat(a == null || a == 1 ? [] : [a]);
}

export { a98rgb2srgbvalues, srgb2a98values };
