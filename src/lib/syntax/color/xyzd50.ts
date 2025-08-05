import {lsrgb2srgbvalues, srgb2lsrgbvalues} from "./srgb.ts";
import {multiplyMatrices} from "./utils/index.ts";
import {xyz2lab} from "./lab.ts";
import {XYZ_D50_to_D65} from "./xyz.ts";
import {labvalues2lchvalues} from "./lch.ts";

export function srgb2xyzd50values(r: number, g: number, b: number, alpha: number | null = null): number[] {

    [r, g, b] = srgb2lsrgbvalues(r, g, b);

    const rgb: number[] = [

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

    if (alpha != null && alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

/*
*/
export function xyzd502lch(x: number, y: number, z: number, alpha?: number): number[] {

    // @ts-ignore
    const [l, a, b] = xyz2lab(...XYZ_D50_to_D65(x, y, z));
    // L in range [0,100]. For use in CSS, add a percent

    return labvalues2lchvalues(l, a, b, alpha);
}

export function XYZ_D65_to_D50(x: number, y: number, z: number, alpha: number | null = null): number[] {
    // Bradford chromatic adaptation from D65 to D50
    // The matrix below is the result of three operations:
    // - convert from XYZ to retinal cone domain
    // - scale components from one reference white to another
    // - convert back to XYZ
    // see https://github.com/LeaVerou/color.js/pull/354/files

    let M = [
        [1.0479297925449969, 0.022946870601609652, -0.05019226628920524],
        [0.02962780877005599, 0.9904344267538799, -0.017073799063418826],
        [-0.009243040646204504, 0.015055191490298152, 0.7518742814281371]
    ];

    return multiplyMatrices(M, [x, y, z]).concat(alpha == null || alpha == 1 ? [] : [alpha]);
}

export function xyzd502srgb(x: number, y: number, z: number, alpha: number | null = null): number[] {

    // @ts-ignore
    return lsrgb2srgbvalues(
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
        1.405386058324125 * z,
        alpha);
}