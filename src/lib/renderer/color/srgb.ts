// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// srgb-linear -> srgb
// 0 <= r, g, b <= 1
import {getComponents, roundWithPrecision} from "./utils";
import {ColorToken, DimensionToken, NumberToken, PercentageToken, Token} from "../../../@types";
import {getAngle, getNumber} from "./color";
import {EnumToken} from "../../ast";
import {Lab_to_sRGB} from "./lab";

export function lab2srgb(token: ColorToken): number[] {

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
    const rgb: number[] = Lab_to_sRGB(l, a, b);

    //
    if (alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

export function lch2srgb(token: ColorToken): number[] {

    const components: Token[] = getComponents(token);

    // @ts-ignore
    let t: NumberToken | PercentageToken = <NumberToken | PercentageToken>components[0];

    // @ts-ignore
    const l: number = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 100 : 1);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[1];

    // @ts-ignore
    const c: number = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 150 : 1);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[2];

    // @ts-ignore
    const h: number = getAngle(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[3];

    // @ts-ignore
    const alpha: number = t == null ? 1 : getNumber(t);

    // https://www.w3.org/TR/css-color-4/#lab-to-lch
    const a: number = c * Math.cos(360 * h * Math.PI / 180);
    const b: number = c * Math.sin(360 * h * Math.PI / 180);

    const rgb: number[] = Lab_to_sRGB(l, a, b);
    //
    if (alpha != 1) {

        rgb.push(alpha);
    }

    return rgb;
}

export function gam_sRGB(r: number, g: number, b: number): number[] {

    // convert an array of linear-light sRGB values in the range 0.0-1.0
    // to gamma corrected form
    // https://en.wikipedia.org/wiki/SRGB
    // Extended transfer function:
    // For negative values, linear portion extends on reflection
    // of axis, then uses reflected pow below that
    return [r, g, b].map( (val: number): number => {

        let abs: number = Math.abs(val);

        if (Math.abs(val) > 0.0031308) {

            return (Math.sign(val) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
        }

        return 12.92 * val;
    });
}

export function gam_ProPhoto(r: number, g: number, b: number): number[] {
    // convert an array of linear-light prophoto-rgb  in the range 0.0-1.0
    // to gamma corrected form
    // Transfer curve is gamma 1.8 with a small linear portion
    // TODO for negative values, extend linear portion on reflection of axis, then add pow below that
    const Et: number = 1 / 512;
    return [r, g, b].map(function (val: number): number {
        let sign: number = val < 0 ? -1 : 1;
        let abs: number = Math.abs(val);

        if (abs >= Et) {
            return roundWithPrecision(sign * Math.pow(abs, 1 / 1.8), val);
        }

        return roundWithPrecision(16 * val, val);
    });
}

// export function gam_a98rgb(r: number, g: number, b: number): number[] {
//     // convert an array of linear-light a98-rgb  in the range 0.0-1.0
//     // to gamma corrected form
//     // negative values are also now accepted
//     return [r, g, b].map(function (val: number): number {
//         let sign: number = val < 0? -1 : 1;
//         let abs: number = Math.abs(val);
//
//         return roundWithPrecision(sign * Math.pow(abs, 256/563), val);
//     });
// }

export function lin_ProPhoto(r: number, g: number, b: number): number[] {
    // convert an array of prophoto-rgb values
    // where in-gamut colors are in the range [0.0 - 1.0]
    // to linear light (un-companded) form.
    // Transfer curve is gamma 1.8 with a small linear portion
    // Extended transfer function
    const Et2: number = 16 / 512;
    return [r, g, b].map(function (val: number): number {
        let sign: number = val < 0 ? -1 : 1;
        let abs: number = Math.abs(val);

        if (abs <= Et2) {
            return roundWithPrecision(val / 16, val);
        }

        return roundWithPrecision(sign * Math.pow(abs, 1.8), val);
    });
}

export function lin_a98rgb(r: number, g: number, b: number): number[] {
    // convert an array of a98-rgb values in the range 0.0 - 1.0
    // to linear light (un-companded) form.
    // negative values are also now accepted
    return [r, g, b].map(function (val: number): number {
        let sign: number = val < 0 ? -1 : 1;
        let abs: number = Math.abs(val);

        return roundWithPrecision(sign * Math.pow(abs, 563 / 256), val);
    });
}

export function lin_2020(r: number, g: number, b: number): number[] {
    // convert an array of rec2020 RGB values in the range 0.0 - 1.0
    // to linear light (un-companded) form.
    // ITU-R BT.2020-2 p.4

    const α: number = 1.09929682680944;
    const β: number = 0.018053968510807;

    return [r, g, b].map(function (val: number): number {
        let sign: number = val < 0 ? -1 : 1;
        let abs: number = Math.abs(val);

        if (abs < β * 4.5) {
            return roundWithPrecision(val / 4.5, val);
        }

        return roundWithPrecision(sign * (Math.pow((abs + α - 1) / α, 1 / 0.45)), val);
    });
}
