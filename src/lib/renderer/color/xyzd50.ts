import {multiplyMatrices} from "./utils";
import {Lab_to_XYZ} from "./lab";

export function lab2xyzd50(l: number, a: number, b: number, alpha?: number): number[] {

    // @ts-ignore
    const [x, y, z] = XYZ_D65_to_D50(...Lab_to_XYZ(l, a, b));

    return alpha == null || alpha == 1 ? [x, y, z] : [x, y, z, alpha];
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
