import {ColorToken, DimensionToken, NumberToken, PercentageToken, Token} from "../../../@types";
import {COLORS_NAMES, getAngle, getNumber, minmax} from "./color";
import {getComponents} from "./utils";
import {OKLab_to_sRGB} from "./oklab";
import {expandHexValue} from "./hex";
import {EnumToken} from "../../ast";
import {Lab_to_sRGB} from "./lab";

export function hex2rgb(token: ColorToken): number[] {

    const value: string = expandHexValue(token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : token.val);
    const rgb: number[] = [];

    for (let i = 1; i < value.length; i += 2) {

        rgb.push(parseInt(value.slice(i, i + 2), 16));
    }

    return rgb;
}

export function hwb2rgb(token: ColorToken): number[] {

    const {h: hue, s: white, l: black, a: alpha} = hslvalues(token);

    const rgb: number[] = hsl2rgbvalues(hue, 1, .5);

    for (let i = 0; i < 3; i++) {

        rgb[i] *= (1 - white - black);
        rgb[i] = Math.round(rgb[i] + white);
    }

    if (alpha != null && alpha != 1) {

        rgb.push(Math.round(255 * alpha));
    }

    return rgb;
}

export function hsl2rgb(token: ColorToken): number[] {

    let {h, s, l, a} = hslvalues(token);

    return hsl2rgbvalues(h, s, l, a);
}


export function cmyk2rgb(token: ColorToken): number[] {

    const components: Token[] = getComponents(token);

    // @ts-ignore
    let t: NumberToken | PercentageToken = <NumberToken | PercentageToken>components[0];

    // @ts-ignore
    const c: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[1];

    // @ts-ignore
    const m: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[2];

    // @ts-ignore
    const y: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[3];

    // @ts-ignore
    const k: number = getNumber(t);

    const rgb: number[] = [
        Math.round(255 * (1 - Math.min(1, c * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, m * (1 - k) + k))),
        Math.round(255 * (1 - Math.min(1, y * (1 - k) + k)))
    ];

    // @ts-ignore
    if (token.chi.length >= 9) {

        // @ts-ignore
        t = <NumberToken | PercentageToken>token.chi[8];

        // @ts-ignore
        rgb.push(Math.round(255 * getNumber(t)));
    }

    return rgb;
}


export function oklab2rgb(token: ColorToken): number[] {

    const components: Token[] = getComponents(token);

    // @ts-ignore
    let t: NumberToken | PercentageToken = <NumberToken | PercentageToken>components[0];

    // @ts-ignore
    const l: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[1];

    // @ts-ignore
    const a: number = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? .4 : 1);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[2];

    // @ts-ignore
    const b: number = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? .4 : 1);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[3];

    // @ts-ignore
    const alpha: number = t == null ? 1 : getNumber(t);

    const rgb: number[] = OKLab_to_sRGB(l, a, b).map(v => {

        return Math.round(255 * v)
    });

    if (alpha != 1) {

        rgb.push(Math.round(255 * alpha));
    }

    return rgb.map(((value: number) => minmax(value, 0, 255)));
}

export function oklch2rgb(token: ColorToken): number[] {

    const components: Token[] = getComponents(token);

    // @ts-ignore
    let t: NumberToken | PercentageToken = <NumberToken | PercentageToken>components[0];

    // @ts-ignore
    const l: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[1];

    // @ts-ignore
    const c: number = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? .4 : 1);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[2];

    // @ts-ignore
    const h: number = getAngle(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[3];

    // @ts-ignore
    const alpha: number = t == null ? 1 : getNumber(t);

    // https://www.w3.org/TR/css-color-4/#lab-to-lch
    const rgb: number[] = OKLab_to_sRGB(l, c * Math.cos(360 * h * Math.PI / 180), c * Math.sin(360 * h * Math.PI / 180));

    if (alpha != 1) {

        rgb.push(alpha);
    }

    return rgb.map(((value: number): number => minmax(Math.round(255 * value), 0, 255)));
}

export function lab2rgb(token: ColorToken): number[] {

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

        rgb.push( alpha);
    }

    return rgb.map(((value: number): number => minmax(Math.round(value * 255), 0, 255)));
}

export function lch2rgb(token: ColorToken): number[] {

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

    return rgb.map(((value: number): number => minmax(value * 255, 0, 255)));
}

export function hslvalues(token: ColorToken): {h: number, s: number, l: number, a?: number | null} {

    const components: Token[] = getComponents(token);

    let t: PercentageToken | NumberToken;

    // @ts-ignore
    let h: number = getAngle(<NumberToken | DimensionToken>components[0]);

    // @ts-ignore
    t = <NumberToken | DimensionToken>components[1];
    // @ts-ignore
    let s: number = getNumber(t);
    // @ts-ignore
    t = <NumberToken | DimensionToken>components[2];
    // @ts-ignore
    let l: number = getNumber(t);

    let a = null;

    if (token.chi?.length == 4) {

        // @ts-ignore
        t = token.chi[3];

        // @ts-ignore
        if ((t.typ == EnumToken.IdenTokenType && t.val == 'none') || (
                t.typ == EnumToken.PercentageTokenType && +t.val < 100) ||
            // @ts-ignore
            (t.typ == EnumToken.NumberTokenType && t.val < 1)) {

            // @ts-ignore
            a = getNumber(t);
        }
    }

    return a == null ? {h, s, l} : {h, s, l, a};
}

export function hsl2rgbvalues(h: number, s: number, l: number, a: number | null = null): number[] {

    let v: number = l <= .5 ? l * (1.0 + s) : l + s - l * s;

    let r: number = l;
    let g: number = l;
    let b: number = l;

    if (v > 0) {

        let m: number = l + l - v;
        let sv: number = (v - m) / v;
        h *= 6.0;
        let sextant: number = Math.floor(h);
        let fract: number = h - sextant;
        let vsf: number = v * sv * fract;
        let mid1: number = m + vsf;
        let mid2: number = v - vsf;

        switch (sextant) {
            case 0:
                r = v;
                g = mid1;
                b = m;
                break;
            case 1:
                r = mid2;
                g = v;
                b = m;
                break;
            case 2:
                r = m;
                g = v;
                b = mid1;
                break;
            case 3:
                r = m;
                g = mid2;
                b = v;
                break;
            case 4:
                r = mid1;
                g = m;
                b = v;
                break;
            case 5:
                r = v;
                g = m;
                b = mid2;
                break;
        }
    }

    const values: number[] = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];

    if (a != null && a != 1) {

        values.push(Math.round(a * 255));
    }

    return values;
}
