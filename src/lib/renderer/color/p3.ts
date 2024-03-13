import {lsrgb2srgb, srgb2lsrgb, xyz2srgb} from "./srgb";
import {multiplyMatrices} from "./utils";
import {srgb2xyz} from "./xyz";

export function p32srgb(r: number, g: number, b: number, alpha?: number) {

    // @ts-ignore
    return xyz2srgb(...lp32xyz(...p32lp3(r, g, b, alpha)));
}

export function srgb2p3(r: number, g: number, b: number, alpha?: number) {

    // @ts-ignore
    return srgb2xyz(...xyz2lp3(...lp32p3(r, g, b, alpha)));
}

export function p32lp3(r: number, g: number, b: number, alpha?: number) {
    // convert an array of display-p3 RGB values in the range 0.0 - 1.0
    // to linear light (un-companded) form.

    return srgb2lsrgb(r, g, b, alpha);	// same as sRGB
}

export function lp32p3(r: number, g: number, b: number, alpha?: number) {
    // convert an array of linear-light display-p3 RGB  in the range 0.0-1.0
    // to gamma corrected form

    return lsrgb2srgb(r, g, b, alpha);	// same as sRGB
}

export function lp32xyz(r: number, g: number, b: number, alpha?: number) {
    // convert an array of linear-light display-p3 values to CIE XYZ
    // using  D65 (no chromatic adaptation)
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
    const M: number[][] = [
        [608311 / 1250200, 189793 / 714400, 198249 / 1000160],
        [35783 / 156275, 247089 / 357200, 198249 / 2500400],
        [0 / 1, 32229 / 714400, 5220557 / 5000800],
    ];

    const result: number[] = multiplyMatrices(M, [r, g, b]);

    if (alpha != null && alpha != 1) {
        result.push(alpha);
    }

    return result;
}

export function xyz2lp3(x: number, y: number, z: number, alpha?: number) {
    // convert XYZ to linear-light P3
    const M: number[][] = [
        [446124 / 178915, -333277 / 357830, -72051 / 178915],
        [-14852 / 17905, 63121 / 35810, 423 / 17905],
        [11844 / 330415, -50337 / 660830, 316169 / 330415],
    ];

    const result: number[] = multiplyMatrices(M, [x, y, z]);

    if (alpha != null && alpha != 1) {
        result.push(alpha);
    }

    return result;
}