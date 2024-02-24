import {multiplyMatrices, roundWithPrecision} from "./utils";
import {gam_sRGB} from "./srgb";

export function XYZ_to_sRGB(x: number, y: number, z: number): number[] {

    // @ts-ignore
    return gam_sRGB(...XYZ_to_lin_sRGB(x, y, z));
}

export function XYZ_to_lin_sRGB(x: number, y: number, z: number): number[] {
    // convert XYZ to linear-light sRGB

    const M: number[][] = [
        [   12831 /   3959,    -329 /    214, -1974 /   3959 ],
        [ -851781 / 878810, 1648619 / 878810, 36519 / 878810 ],
        [     705 /  12673,   -2585 /  12673,   705 /    667 ],
    ];

    const XYZ: number[] = [x, y, z]; // convert to XYZ

    return multiplyMatrices(M, XYZ).map((v: number, index: number) => roundWithPrecision(v, XYZ[index]));
}

export function XYZ_D50_to_sRGB(x: number, y: number, z: number): number[] {

    // @ts-ignore
    return gam_sRGB(...XYZ_to_lin_sRGB(...D50_to_D65(x, y, z)));
}

export function D50_to_D65(x: number, y: number, z: number): number[] {
    // Bradford chromatic adaptation from D50 to D65
    const M: number[][] = [
        [  0.9554734527042182,   -0.023098536874261423,  0.0632593086610217   ],
        [ -0.028369706963208136,  1.0099954580058226,    0.021041398966943008 ],
        [  0.012314001688319899, -0.020507696433477912,  1.3303659366080753   ]
    ];
    const XYZ: number[] = [x, y, z];

    return multiplyMatrices(M, XYZ).map((v: number, index: number) => roundWithPrecision(v, XYZ[index]));
}