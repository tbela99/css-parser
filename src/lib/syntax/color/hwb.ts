import { hsl2hsv } from "./hsv.ts";
import type {
    AngleToken,
    ColorToken,
    IdentToken,
    NumberToken,
    PercentageToken,
    Token,
} from "../../../@types/index.d.ts";
import { getColorComponents } from "./utils/components.ts";
import { color2srgbvalues, getAngle, getNumber } from "./color.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import {
    cmyk2srgbvalues,
    hslvalues,
    lab2srgbvalues,
    lch2srgbvalues,
    oklab2srgbvalues,
    oklch2srgbvalues,
} from "./srgb.ts";

export function rgb2hwbToken(token: ColorToken): ColorToken | null {
    const values: number[] | null = rgb2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function hsl2hwbToken(token: ColorToken): ColorToken | null {
    const values: number[] | null = hsl2hwbvalues(token);

    if (values == null) {
        return null;
    }

    // console.error(new Error("hsl2hwbToken"));
    return hwbToken(values);
}

export function cmyk2hwbToken(token: ColorToken): ColorToken | null {
    const values: number[] | null = cmyk2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function oklab2hwbToken(token: ColorToken): ColorToken | null {
    const values: number[] | null = oklab2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function oklch2hwbToken(token: ColorToken): ColorToken | null {
    const values: number[] | null = oklch2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function lab2hwbToken(token: ColorToken): ColorToken | null {
    const values: number[] | null = lab2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function lch2hwbToken(token: ColorToken): ColorToken | null {
    const values: number[] | null = lch2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function color2hwbToken(token: ColorToken): ColorToken | null {
    const values: number[] | null = color2hwbvalues(token);

    if (values == null) {
        return null;
    }

    return hwbToken(values);
}

export function hwbToken(values: number[]): ColorToken {
    const chi: Token[] = <Token[]>[
        { typ: EnumToken.NumberTokenType, val: values[0] },
        { typ: EnumToken.PercentageTokenType, val: values[1] },
        { typ: EnumToken.PercentageTokenType, val: values[2] },
    ];

    if (values.length == 4) {
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
        val: "hwb",
        chi,
        kin: ColorType.HWB,
    };
}

export function rgb2hwbvalues(token: ColorToken): number[] {
    const values = getColorComponents(token)!.map((t: Token, index: number): number => {
        if (index == 3) {
            return getNumber(<IdentToken | NumberToken | PercentageToken>t);
        }

        return getNumber(<IdentToken | NumberToken | PercentageToken>t) / 255;
    }) as [number, number, number, number];

    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function cmyk2hwbvalues(token: ColorToken): number[] | null {
    const values = cmyk2srgbvalues(token);
    return values == null ? null : srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function hsl2hwbvalues(token: ColorToken): number[] | null {
    const values = hslvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return hslvalues2hwbvalues(values.h, values.s, values.l, values.a);
}

export function lab2hwbvalues(token: ColorToken): number[] | null {
    const values: number[] | null = lab2srgbvalues(token);

    if (values == null) {
        return null;
    }
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function lch2hwbvalues(token: ColorToken): number[] | null {
    const values: number[] | null = lch2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function oklab2hwbvalues(token: ColorToken): number[] | null {
    const values: number[] | null = oklab2srgbvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function oklch2hwbvalues(token: ColorToken): number[] {
    const values: number[] | null = oklch2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function color2hwbvalues(token: ColorToken): number[] | null {
    const values: number[] | null = color2srgbvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function hwbvalues(token: ColorToken): { h: number; w: number; b: number; a?: number | null } | null {
    const components: Token[] | null = getColorComponents(token);

    if (components == null) {
        return null;
    }

    let t: PercentageToken | NumberToken;

    // @ts-ignore
    let h: number = getAngle(<NumberToken | DimensionToken>components[0]) * 360;

    // @ts-ignore
    t = <NumberToken | DimensionToken>components[1];
    // @ts-ignore
    let w: number = getNumber(t);
    // @ts-ignore
    t = <NumberToken | DimensionToken>components[2];
    // @ts-ignore
    let b: number = getNumber(t);

    // if (components[1].typ == EnumToken.NumberTokenType) {
    w *= 100;
    // }

    // if (components[2].typ == EnumToken.NumberTokenType) {
    b *= 100;
    // }

    let a = null;

    if (components.length == 4) {
        // @ts-ignore
        t = components[3];

        // @ts-ignore
        a = getNumber(t);
    }

    return a == null ? { h, w, b } : { h, w, b, a };
}

export function srgb2hwb(r: number, g: number, b: number, a: number | null = null, fallback: number = 0): number[] {
    // 1. Clamp inputs to the standard web-safe sRGB gamut [0.0, 1.0]
    const rClamp = Math.min(1, Math.max(0, r));
    const gClamp = Math.min(1, Math.max(0, g));
    const bClamp = Math.min(1, Math.max(0, b));

    const cMax = Math.max(rClamp, gClamp, bClamp);
    const cMin = Math.min(rClamp, gClamp, bClamp);
    const delta = cMax - cMin;

    // 2. Whiteness and Blackness calculations
    const w = cMin;
    const bl = 1 - cMax;

    // 3. Calculate Hue
    let h = 0;
    if (delta !== 0) {
        if (cMax === rClamp) {
            h = 60 * (((gClamp - bClamp) / delta) % 6);
        } else if (cMax === gClamp) {
            h = 60 * ((bClamp - rClamp) / delta + 2);
        } else if (cMax === bClamp) {
            h = 60 * ((rClamp - gClamp) / delta + 4);
        }

        if (h < 0) {
            h += 360;
        }
    }

    const result: number[] = [h, w * 100, bl * 100];

    if (a != null) {
        result.push(a);
    }

    return result;
}

export function hsv2hwb(h: number, s: number, v: number, a: number | null = null): number[] {
    const result: number[] = [h, (1 - s) * v, 1 - v];

    if (a != null) {
        result.push(a);
    }

    return result;
}

export function hslvalues2hwbvalues(h: number, s: number, l: number, a: number | null = null): number[] {
    const sNorm = s / 100;
    const lNorm = l / 100;

    // Keep Hue cleanly bound to standard circle loops
    const hue = ((h % 360) + 360) % 360;

    // 1. Compute the intermediate HSV Value component (brightness peak)
    const v = lNorm + sNorm * Math.min(lNorm, 1 - lNorm);

    // 2. Compute Chroma
    const chroma = 2 * (v - lNorm);

    // 3. Extract Whiteness and Blackness
    const w = v - chroma;
    const b = 1 - v;

    const hwb = [hue, w * 100, b * 100];

    if (a != null && a != 1) {
        hwb.push(a);
    }

    return hwb;
}
