import {multiplyMatrices} from "./utils/index.ts";
import {srgb2lsrgbvalues} from "./srgb.ts";
import {Lab_to_XYZ} from "./lab.ts";
import {XYZ_D65_to_D50} from "./xyzd50.ts";

export function lab2xyz(l: number, a: number, b: number, alpha?: number): number[] {

    const [x, y, z] = Lab_to_XYZ(l, a, b);

    return alpha == null || alpha == 1 ? [x, y, z] : [x, y, z, alpha];
}

export function XYZ_to_lin_sRGB(x: number, y: number, z: number, alpha: number | null = null): number[] {
    // convert XYZ to linear-light sRGB

    const M: number[][] = [
        [12831 / 3959, -329 / 214, -1974 / 3959],
        [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
        [705 / 12673, -2585 / 12673, 705 / 667],
    ];

    const XYZ: number[] = [x, y, z]; // convert to XYZ

    return multiplyMatrices(M, XYZ).map((v: number) => v).concat(alpha == null || alpha == 1 ? [] : [alpha]);
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

// xyz d65
export function srgb2xyz(r: number, g: number, b: number, alpha?: number): number[] {

    [r, g, b] = srgb2lsrgbvalues(r, g, b);

    // xyx d65
    let rgb: number[] = [

        0.4123907992659595 * r +
        0.35758433938387796 * g +
        0.1804807884018343 * b,

        0.21263900587151036 * r +
        0.7151686787677559 * g +
        0.07219231536073371 * b,

        0.01933081871559185 * r +
        0.11919477979462599 * g +
        0.9505321522496606 * b
    ];

    if (alpha != null && alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

// xyz d50
export function srgb2xyz_d50(r: number, g: number, b: number, alpha?: number): number[] {

    // xyx d65
    // @ts-ignore
    let rgb: number[] = XYZ_D65_to_D50(...srgb2xyz(r, g, b));

    if (alpha != null && alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}
