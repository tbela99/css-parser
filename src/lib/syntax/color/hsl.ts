import { hwb2hsv } from "./hsv.ts";
import type { ColorToken, IdentToken, NumberToken, PercentageToken, Token } from "../../../@types/index.d.ts";
import { color2srgbvalues, getNumber } from "./color.ts";
import { cmyk2rgbvalues, lab2rgbvalues, lch2rgbvalues } from "./rgb.ts";
import { getColorComponents } from "./utils/components.ts";
import { hex2srgbvalues, hslvalues, oklab2srgbvalues, oklch2srgbvalues } from "./srgb.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";

export function hex2HslToken(token: ColorToken): ColorToken | null {
    let values = hex2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return hslToken(srgb2hslvalues(values[0], values[1], values[2], values[3]));
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

    return hslToken(srgb2hslvalues(values[0], values[1], values[2], values[3]));
}

function hslToken(values: number[]): ColorToken {
    values[0] = values[0] * 360;

    const chi: Token[] = <Token[]>[
        { typ: EnumToken.NumberTokenType, val: values[0] },
        { typ: EnumToken.PercentageTokenType, val: values[1] * 100 },
        { typ: EnumToken.PercentageTokenType, val: values[2] * 100 },
    ];

    if (values.length == 4 && values[3] != 1) {
        chi.push(
            { typ: EnumToken.LiteralTokenType, val: "/" },
            {
                typ: EnumToken.PercentageTokenType,
                val: values[3] * 100,
            },
        );
    }

    return {
        typ: EnumToken.ColorTokenType,
        val: "hsl",
        chi,
        kin: ColorType.HSL,
    };
}

export function rgb2hslvalues(token: ColorToken): number[] | null {
    const chi: Token[] | null = getColorComponents(token);

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

    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
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
        (s * v) / ((h = (2 - s) * v) < 1 ? h : 2 - h),

        h / 2, //Lightness is (2-sat)*val/2
    ];

    if (a != null) {
        result.push(a);
    }

    return result;
}

export function cmyk2hslvalues(token: ColorToken): number[] | null {
    const values = cmyk2rgbvalues(token);

    return values == null ? null : rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}

export function hwb2hslvalues(token: ColorToken): [number, number, number, number] {
    const hsla = hslvalues(token) as { h: number; s: number; l: number; a: number };
    const hwba = hwb2hsv(hsla.h, hsla.s, hsla.l, hsla.a) as [number, number, number, number];

    return hsv2hsl(hwba[0], hwba[1], hwba[2], hwba[3]) as [number, number, number, number];
}

export function lab2hslvalues(token: ColorToken): number[] | null {
    const values: number[] | null = lab2rgbvalues(token);

    if (values == null) {
        return null;
    }

    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}

export function lch2hslvalues(token: ColorToken): number[] | null {
    const values: number[] | null = lch2rgbvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}

export function oklab2hslvalues(token: ColorToken): number[] | null {
    const t: number[] | null = oklab2srgbvalues(token);
    // @ts-ignore
    return t == null ? null : srgb2hslvalues(t[0], t[1], t[2], t[3]);
}

export function oklch2hslvalues(token: ColorToken): number[] | null {
    const t: number[] | null = oklch2srgbvalues(token);
    // @ts-ignore
    return t == null ? null : srgb2hslvalues(t[0], t[1], t[2], t[3]);
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
        return hsl.concat([<number>a]);
    }

    // @ts-ignore
    return hsl;
}
