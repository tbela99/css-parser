import {multiplyMatrices} from "./utils/index.ts";
import {srgb2lsrgbvalues} from "./srgb.ts";
import {Lab_to_XYZ} from "./lab.ts";

export function lab2xyz(l: number, a: number, b: number, alpha?: number): number[] {

    const [x, y, z] = Lab_to_XYZ(l, a, b);

    return alpha == null || alpha == 1 ? [x, y, z] : [x, y, z, alpha];
}

export function lch2xyz(l: number, c: number, h: number, alpha?: number): number[] {

    return lab2xyz(l, c * Math.cos(h * Math.PI / 180), c * Math.sin(h * Math.PI / 180), alpha);
}


export function XYZ_to_lin_sRGB(x: number, y: number, z: number): number[] {
    // convert XYZ to linear-light sRGB

    const M: number[][] = [
        [12831 / 3959, -329 / 214, -1974 / 3959],
        [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
        [705 / 12673, -2585 / 12673, 705 / 667],
    ];

    const XYZ: number[] = [x, y, z]; // convert to XYZ

    return multiplyMatrices(M, XYZ).map((v: number) => v);
}

export function XYZ_D50_to_D65(x: number, y: number, z: number): number[] {
    // Bradford chromatic adaptation from D50 to D65
    const M: number[][] = [
        [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
        [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
        [0.012314001688319899, -0.020507696433477912, 1.3303659366080753]
    ];
    const XYZ: number[] = [x, y, z];

    return multiplyMatrices(M, XYZ); //.map((v: number) => v);
}
export function srgb2xyz(r: number, g: number, b: number, alpha?: number): number[] {

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
