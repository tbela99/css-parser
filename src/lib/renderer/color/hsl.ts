import {hwb2hsv} from "./hsv.ts";
import type {ColorToken, IdentToken, NumberToken, PercentageToken, Token} from "../../../@types/index.d.ts";
import {getNumber} from "./color.ts";
import {hex2rgb, lab2rgb, lch2rgb, oklab2rgb, oklch2rgb} from "./rgb.ts";
import {getComponents} from "./utils/index.ts";
import {EnumToken} from "../../ast/index.ts";
import {hslvalues} from './srgb.ts';

export function hex2hsl(token: ColorToken): number[] {

    // @ts-ignore
    return rgb2hslvalues(...hex2rgb(token));
}

export function rgb2hsl(token: ColorToken): number[] | null {

    const chi: Token[] | null = getComponents(token);

    if (chi == null) {

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
    t = <NumberToken | PercentageToken | IdentToken>chi[3];
    // @ts-ignore
    let a: number = null;

    if (t != null && !(t.typ == EnumToken.IdenTokenType && t.val == 'none')) {

        // @ts-ignore
        a = getNumber(t) / 255;
    }

    const values: number[] = [r, g, b];

    if (a != null && a != 1) {

        values.push(a);
    }


    // @ts-ignore
    return rgb2hslvalues(...values);
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


export function hwb2hsl(token: ColorToken): [number, number, number, number] {

    // @ts-ignore
    return hsv2hsl(...hwb2hsv(...Object.values(hslvalues(token))));
}

export function lab2hsl(token: ColorToken): number[] {

    // @ts-ignore
    return rgb2hslvalues(...lab2rgb(token));
}

export function lch2hsl(token: ColorToken): number[] {

    // @ts-ignore
    return rgb2hslvalues(...lch2rgb(token));
}

export function oklab2hsl(token: ColorToken): number[] | null {

    const t: number[] | null = oklab2rgb(token);
    // @ts-ignore
    return t == null ? null : rgb2hslvalues(...t);
}

export function oklch2hsl(token: ColorToken): number[] | null{

    const t: number[] | null = oklch2rgb(token);
    // @ts-ignore
    return t == null ? null : rgb2hslvalues(...t);
}

export function rgb2hslvalues(r: number, g: number, b: number, a: number | null = null): number[] {

    return srgb2hsl(r / 255, g / 255, b / 255, a);
}


export function srgb2hsl(r: number, g: number, b: number, a: number | null = null): number[] {

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