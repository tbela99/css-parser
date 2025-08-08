import {XYZ_D65_to_D50, xyzd502srgb} from "./xyzd50.ts";
import {srgb2xyz} from "./xyz.ts";

export function prophotorgb2srgbvalues(r: number, g: number, b: number, a: number | null = null): number[] {

    // @ts-ignore
    return xyzd502srgb(...prophotorgb2xyz50(r, g, b, a));
}

export function srgb2prophotorgbvalues(r: number, g: number, b: number, a?: number): number[] {

    // @ts-ignore
    return xyz50_to_prophotorgb(...XYZ_D65_to_D50(...srgb2xyz(r, g, b, a)));
}

function prophotorgb2lin_ProPhoto(r: number, g: number, b: number, a: number | null = null): number[] {

    return [r, g, b].map(v => {
        let abs = Math.abs(v);
        if (abs >= 16 / 512) {
            return Math.sign(v) * Math.pow(abs, 1.8);
        }
        return v / 16;
    }).concat(a == null || a == 1 ? [] : [a]);
}

function prophotorgb2xyz50(r: number, g: number, b: number, a: number | null = null): number[] {

    [r, g, b, a] = prophotorgb2lin_ProPhoto(r, g, b, a);

    const xyz = [

        0.7977666449006423 * r +
        0.1351812974005331 * g +
        0.0313477341283922 * b,
        0.2880748288194013 * r +
        0.7118352342418731 * g +
        0.0000899369387256 * b,
        0.8251046025104602 * b
    ];

    return xyz.concat(a == null || a == 1 ? [] : [a]);
}

function xyz50_to_prophotorgb(x: number, y: number, z: number, a?: number): number[] {

    // @ts-ignore
    return gam_prophotorgb(...[

        x * 1.3457868816471585 -
        y * 0.2555720873797946 -
        0.0511018649755453 * z,

        x * -0.5446307051249019 +
        y * 1.5082477428451466 +
        0.0205274474364214 * z,
        1.2119675456389452 * z
    ].concat(a == null || a == 1 ? [] : [a]));
}

function gam_prophotorgb(r: number, g: number, b: number, a?: number): number[] {

    return [r, g, b].map(v => {
        let abs = Math.abs(v);
        if (abs >= 1 / 512) {
            return Math.sign(v) * Math.pow(abs, 1 / 1.8);
        }
        return 16 * v;
    }).concat(a == null || a == 1 ? [] : [a]);
}