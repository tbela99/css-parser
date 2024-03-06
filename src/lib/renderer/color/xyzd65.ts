import {multiplyMatrices} from "./utils";
import {srgb2lsrgb} from "./srgb";

export function srgb2xyz(r: number, g: number, b: number): number[] {

    [r, g, b] = srgb2lsrgb(r, g, b);

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
    ]
}

export function XYZ_D65_to_D50(x: number, y: number, z: number): number[] {
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