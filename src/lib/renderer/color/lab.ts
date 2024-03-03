import {D50, e, getComponents, k} from "./utils";
import {srgb2xyz, XYZ_to_sRGB} from "./xyz";
import {ColorToken, NumberToken, PercentageToken, Token} from "../../../@types";
import {hex2srgb, hsl2srgb, hwb2srgb, oklch2srgb, rgb2srgb} from "./srgb";
import {getLCHComponents} from "./lch";
import {getOKLABComponents, OKLab_to_XYZ} from "./oklab";
import {getNumber} from "./color";
import {EnumToken} from "../../ast";

// L: 0% = 0.0, 100% = 100.0
// for a and b: -100% = -125, 100% = 125

export function hex2lab(token: ColorToken) {

    //  @ts-ignore
    return srgb2lab(...hex2srgb(token));
}

export function rgb2lab(token: ColorToken) {
    // @ts-ignore
    return srgb2lab(...rgb2srgb(token));
}

export function hsl2lab(token: ColorToken) {
    // @ts-ignore
    return srgb2lab(...hsl2srgb(token));
}

export function hwb2lab(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2lab(...hwb2srgb(token));
}

export function lch2lab(token: ColorToken) {

    // @ts-ignore
    return lch2labvalues(...getLCHComponents(token));
}

export function oklab2lab(token: ColorToken) {

    // @ts-ignore
    return xyz2lab(...OKLab_to_XYZ(...getOKLABComponents(token)));
}

export function oklch2lab(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2lab(...oklch2srgb(token));
}

export function srgb2lab(r: number, g: number, b: number, a: number | null): number[] {

    // @ts-ignore */
    const result: number[] = xyz2lab(...srgb2xyz(r, g, b));

    if (a != null) {

        result.push(a);
    }

    return result;
}

export function xyz2lab(x: number, y: number, z: number, a: number | null = null): number[] {
    // Assuming XYZ is relative to D50, convert to CIE Lab
    // from CIE standard, which now defines these as a rational fraction
    // var e = 216/24389;  // 6^3/29^3
    // var k = 24389/27;   // 29^3/3^3

    // compute xyz, which is XYZ scaled relative to reference white
    const xyz: number[] = [x, y, z].map((value: number, i: number) => value / D50[i]);

    // now compute f
    const f: number[] = xyz.map((value: number): number => value > e ? Math.cbrt(value) : (k * value + 16) / 116);

    const result : number[] = [
        (116 * f[1]) - 16, 	 // L
        500 * (f[0] - f[1]), // a
        200 * (f[1] - f[2])  // b
    ];
    // L in range [0,100]. For use in CSS, add a percent

    if (a != null && a != 1) {
        result.push(a);
    }

    return result;
}

export function lch2labvalues(l: number, c: number, h: number, a: number | null = null): number[] {
    // l, c * Math.cos(360 * h * Math.PI / 180), c * Math.sin(360 * h * Math.PI / 180
    const result: number[] = [l, c * Math.cos(360 * h * Math.PI / 180), c * Math.sin(360 * h * Math.PI / 180)];

    if (a != null) {
        result.push(a);
    }

    return result;
}

export function getLABComponents(token: ColorToken) {

    const components: Token[] = getComponents(token);

    // @ts-ignore
    let t: NumberToken | PercentageToken = <NumberToken | PercentageToken>components[0];

    // @ts-ignore
    const l: number = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 100 : 1);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[1];

    // @ts-ignore
    const a: number = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 125 : 1);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[2];

    // @ts-ignore
    const b: number = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 125 : 1);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[3];

    // @ts-ignore
    const alpha: number = t == null ? 1 : getNumber(t);

    const result: number[] = [l, a, b];

    if (alpha != null && alpha != 1) {

        result.push(alpha);
    }

    return  result;
}

// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// D50 LAB
export function Lab_to_sRGB(l: number, a: number, b: number): number[] {

    // @ts-ignore
    return XYZ_to_sRGB(...Lab_to_XYZ(l, a, b));
}

// from https://www.w3.org/TR/css-color-4/#color-conversion-code
export function Lab_to_XYZ(l: number, a: number, b: number): number[] {
    // Convert Lab to D50-adapted XYZ
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
    const k: number = 24389 / 27;   // 29^3/3^3
    const e: number = 216 / 24389;  // 6^3/29^3
    const f: number[] = [];

    // compute f, starting with the luminance-related term
    f[1] = (l + 16) / 116;
    f[0] = a / 500 + f[1];
    f[2] = f[1] - b / 200;

    // compute xyz
    const xyz: number[] = [
        Math.pow(f[0], 3) > e ? Math.pow(f[0], 3) : (116 * f[0] - 16) / k,
        l > k * e ? Math.pow((l + 16) / 116, 3) : l / k,
        Math.pow(f[2], 3) > e ? Math.pow(f[2], 3) : (116 * f[2] - 16) / k
    ];

    // Compute XYZ by scaling xyz by reference white
    return xyz.map((value: number, i: number) => value * D50[i]);
}