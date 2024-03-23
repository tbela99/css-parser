import {e, k, multiplyMatrices} from "./utils";
import {Lab_to_XYZ, xyz2lab} from "./lab";
import {lab2lchvalues} from "./lch";
import {XYZ_D50_to_D65} from "./xyz";

export function lab2xyzd50(l: number, a: number, b: number, alpha?: number): number[] {

    // @ts-ignore
    const [x, y, z] = XYZ_D65_to_D50(...Lab_to_XYZ(l, a, b));

    return alpha == null || alpha == 1 ? [x, y, z] : [x, y, z, alpha];
}

export function xyzd502lch(x: number, y: number, z: number, alpha?: number): number[] {

    // @ts-ignore
    const [l, a, b] = xyz2lab(...XYZ_D50_to_D65(x, y, z));
    // L in range [0,100]. For use in CSS, add a percent

    // @ts-ignore
    return lab2lchvalues(l, a, b, alpha);
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
