import { multiplyMatrices } from './utils/matrix.js';
import { roundWithPrecision } from './utils/round.js';
import { gam_sRGB } from './rgb.js';

function XYZ_to_sRGB(x, y, z) {
    // @ts-ignore
    return gam_sRGB(...XYZ_to_lin_sRGB(x, y, z));
}
function XYZ_to_lin_sRGB(x, y, z) {
    // convert XYZ to linear-light sRGB
    const M = [
        [12831 / 3959, -329 / 214, -1974 / 3959],
        [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
        [705 / 12673, -2585 / 12673, 705 / 667],
    ];
    const XYZ = [x, y, z]; // convert to XYZ
    return multiplyMatrices(M, XYZ).map((v, index) => roundWithPrecision(v, XYZ[index]));
}
function XYZ_D50_to_sRGB(x, y, z) {
    // @ts-ignore
    return gam_sRGB(...XYZ_to_lin_sRGB(...D50_to_D65(x, y, z)));
}
function D50_to_D65(x, y, z) {
    // Bradford chromatic adaptation from D50 to D65
    const M = [
        [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
        [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
        [0.012314001688319899, -0.020507696433477912, 1.3303659366080753]
    ];
    const XYZ = [x, y, z];
    return multiplyMatrices(M, XYZ).map((v, index) => roundWithPrecision(v, XYZ[index]));
}

export { D50_to_D65, XYZ_D50_to_sRGB, XYZ_to_lin_sRGB, XYZ_to_sRGB };
