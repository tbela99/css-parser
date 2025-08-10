import {hwb2hsv} from "./hsv.ts";
import type {ColorToken, IdentToken, NumberToken, PercentageToken, Token} from "../../../@types/index.d.ts";
import {color2srgbvalues, getNumber, toPrecisionAngle} from "./color.ts";
import {cmyk2rgbvalues, lab2rgbvalues, lch2rgbvalues} from "./rgb.ts";
import {getComponents} from "./utils/index.ts";
import {hex2srgbvalues, hslvalues, oklab2srgbvalues, oklch2srgbvalues} from './srgb.ts';
import {ColorType, EnumToken} from "../../ast/index.ts";

export function hex2HslToken(token: ColorToken): ColorToken | null {

    // @ts-ignore
    return hslToken(srgb2hslvalues(...hex2srgbvalues(token)));
}

export function rgb2HslToken(token: ColorToken): ColorToken | null {

    const values = rgb2hslvalues(token);

    if (values == null) {
        return null;
    }

    return hslToken(values);
}

export function hwb2HslToken(token: ColorToken): ColorToken | null {

    const values = hwb2hslvalues(token);

    if (values == null) {
        return null;
    }

    return hslToken(values);
}

export function cmyk2HslToken(token: ColorToken): ColorToken | null {

    const values = cmyk2hslvalues(token);

    if (values == null) {
        return null;
    }

    return hslToken(values);
}

export function oklab2HslToken(token: ColorToken): ColorToken | null {

    const values = oklab2hslvalues(token);

    if (values == null) {
        return null;
    }

    return hslToken(values);
}

export function oklch2HslToken(token: ColorToken): ColorToken | null {

    const values = oklch2hslvalues(token);

    if (values == null) {
        return null;
    }

    return hslToken(values);
}

export function lab2HslToken(token: ColorToken): ColorToken | null {

    const values = lab2hslvalues(token);

    if (values == null) {
        return null;
    }

    return hslToken(values);
}

export function lch2HslToken(token: ColorToken): ColorToken | null {

    const values = lch2hslvalues(token);

    if (values == null) {
        return null;
    }

    return hslToken(values);
}

export function color2HslToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = color2srgbvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return hslToken(srgb2hslvalues(...values));
}

function hslToken(values: number[]): ColorToken {

    values[0] = toPrecisionAngle(values[0] * 360);

    const chi: Token[] = <Token[]>[

        {typ: EnumToken.NumberTokenType, val: values[0]},
        {typ: EnumToken.PercentageTokenType, val: values[1] * 100},
        {typ: EnumToken.PercentageTokenType, val: values[2] * 100},
    ];

    if (values.length == 4 && values[3] != 1) {

        chi.push({typ: EnumToken.LiteralTokenType, val: '/'}, {typ: EnumToken.PercentageTokenType, val: values[3] * 100});
    }

    return {
        typ: EnumToken.ColorTokenType,
        val: 'hsl',
        chi,
        kin: ColorType.HSL
    }
}

export function rgb2hslvalues(token: ColorToken): number[] | null {

    const chi: Token[] | null = getComponents(token);

    if (chi == null || chi.length < 3) {

        return null;
    }

    // @ts-ignore
    let t: NumberToken | PercentageToken | IdentToken = <NumberToken | PercentageToken | IdentToken>chi[0];

    // @ts-ignore
    let r: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken | IdentToken>chi[1];
    // @ts-ignore
    let g: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken | IdentToken>chi[2];
    // @ts-ignore
    let b: number = getNumber(t);

    // @ts-ignore
    let a: number = null;

    if (chi.length == 4) {

        a = getNumber(chi[3] as NumberToken | PercentageToken | IdentToken);
    }

    const values: number[] = [r, g, b];

    if (a != null && a != 1) {

        values.push(a);
    }


    // @ts-ignore
    return rgbvalues2hslvalues(...values);
}

// https://gist.github.com/defims/0ca2ef8832833186ed396a2f8a204117#file-annotated-js
export function hsv2hsl(h: number, s: number, v: number, a?: number): number[] {

    const result = [
        //[hue, saturation, lightness]
        //Range should be between 0 - 1
        h, //Hue stays the same

        //Saturation is very different between the two color spaces
        //If (2-sat)*val < 1 set it to sat*val/((2-sat)*val)
        //Otherwise sat*val/(2-(2-sat)*val)
        //Conditional is not operating with hue, it is reassigned!
        s * v / ((h = (2 - s) * v) < 1 ? h : 2 - h),

        h / 2, //Lightness is (2-sat)*val/2
    ];

    if (a != null) {
        result.push(a);
    }

    return result;
}

export function cmyk2hslvalues(token: ColorToken): number[] {

    const values = cmyk2rgbvalues(token);

    // @ts-ignore
    return values == null ? null : rgbvalues2hslvalues(...values);
}

export function hwb2hslvalues(token: ColorToken): [number, number, number, number] {

    // @ts-ignore
    return hsv2hsl(...hwb2hsv(...Object.values(hslvalues(token))));
}

export function lab2hslvalues(token: ColorToken): number[] {

    // @ts-ignore
    return rgbvalues2hslvalues(...lab2rgbvalues(token));
}

export function lch2hslvalues(token: ColorToken): number[] {

    // @ts-ignore
    return rgbvalues2hslvalues(...lch2rgbvalues(token));
}

export function oklab2hslvalues(token: ColorToken): number[] | null {

    const t: number[] | null = oklab2srgbvalues(token);
    // @ts-ignore
    return t == null ? null : srgb2hslvalues(...t);
}

export function oklch2hslvalues(token: ColorToken): number[] | null{

    const t: number[] | null = oklch2srgbvalues(token);
    // @ts-ignore
    return t == null ? null : srgb2hslvalues(...t);
}

export function rgbvalues2hslvalues(r: number, g: number, b: number, a: number | null = null): number[] {

    return srgb2hslvalues(r / 255, g / 255, b / 255, a);
}


export function srgb2hslvalues(r: number, g: number, b: number, a: number | null = null): number[] {

    let max: number = Math.max(r, g, b);
    let min: number = Math.min(r, g, b);
    let h: number = 0;
    let s: number = 0;
    let l: number = (max + min) / 2;

    if (max != min) {
        let d: number = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    const hsl: number[] = [h, s, l];

    if (a != null && a < 1) {

        // @ts-ignore
        return hsl.concat([<number>a])

    }

    // @ts-ignore
    return hsl;
}