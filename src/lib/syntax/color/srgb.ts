// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// srgb-linear -> srgb
// 0 <= r, g, b <= 1
import { getColorComponents } from "./utils/components.ts";
import type {
    ColorToken,
    DimensionToken,
    IdentToken,
    NumberToken,
    PercentageToken,
    Token,
} from "../../../@types/index.d.ts";
import { color2srgbvalues, getAngle, getNumber } from "./color.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import { getLABComponents, Lab_to_sRGB, lchvalues2labvalues } from "./lab.ts";
import { expandHexValue } from "./hex.ts";
import { getOKLABComponents, OKLab_to_sRGB } from "./oklab.ts";
import { getLCHComponents } from "./lch.ts";
import { getOKLCHComponents } from "./oklch.ts";
import { XYZ_to_lin_sRGB } from "./xyz.ts";
import { COLORS_NAMES } from "../constants.ts";
import { parseColor } from "../syntax.ts";
import { hwbvalues } from "./hwb.ts";
import { backup } from "node:sqlite";

export function srgbvalues(token: ColorToken | IdentToken): number[] | null {
    if (token.typ === EnumToken.IdenTokenType) {
        token = parseColor(token) as ColorToken;
    }

    switch (token.kin) {
        case ColorType.LIT:
        case ColorType.HEX:
            return hex2srgbvalues(token);

        case ColorType.RGB:
        case ColorType.RGBA:
            return rgb2srgb(token);

        case ColorType.HSL:
        case ColorType.HSLA:
            return hsl2srgb(token);

        case ColorType.HWB:
            return hwb2srgbvalues(token);

        case ColorType.LAB:
            return lab2srgbvalues(token);

        case ColorType.LCH:
            return lch2srgbvalues(token);

        case ColorType.OKLAB:
            return oklab2srgbvalues(token);

        case ColorType.OKLCH:
            return oklch2srgbvalues(token);

        case ColorType.COLOR:
            return color2srgbvalues(token);
    }

    return null;
}

export function rgb2srgb(token: ColorToken): number[] | null {
    return (
        getColorComponents(token)?.map?.((t: Token, index: number): number =>
            index == 3
                ? t.typ == EnumToken.IdenTokenType && (t as IdentToken).val == "none"
                    ? 1
                    : getNumber(<IdentToken | NumberToken | PercentageToken>t)
                : ((t.typ == EnumToken.PercentageTokenType ? 255 : 1) *
                      getNumber(<IdentToken | NumberToken | PercentageToken>t)) /
                  255,
        ) ?? null
    );
}

export function rgb2srgbvalues(token: ColorToken): number[] | null {
    return (
        getColorComponents(token)?.map?.((t: Token, index: number): number =>
            index == 3
                ? getNumber(<IdentToken | NumberToken | PercentageToken>t)
                : getNumber(<IdentToken | NumberToken | PercentageToken>t) / 255,
        ) ?? null
    );
}

// export function rgbvalues2srgbvalues(r: number, g: number, b: number, a: number | null = null): number[] | null {
//     const result = [r / 255, g / 255, b / 255];
//
//     if (a != null && a != 1) {
//         result.push(a);
//     }
//
//     return result;
// }

export function hex2srgbvalues(token: ColorToken): number[] {
    const value: string = expandHexValue(
        token.kin == ColorType.LIT ? COLORS_NAMES[token.val.toLowerCase()] : token.val,
    );
    const rgb: number[] = [];

    for (let i = 1; i < value.length; i += 2) {
        rgb.push(parseInt(value.slice(i, i + 2), 16) / 255);
    }

    if (rgb.length == 4) {
        rgb[3] = +rgb[3].toFixed(2);
    }

    return rgb;
}

// xyz d65 input
export function xyz2srgb(x: number, y: number, z: number, alpha: number | null = null): number[] {
    let values = XYZ_to_lin_sRGB(x, y, z);
    // @ts-ignore
    return lsrgb2srgbvalues(values[0], values[1], values[2], alpha);
}

export function hwb2srgbvalues(token: ColorToken): number[] | null {
    const { h, w, b, a } = hwbvalues(token) ?? {};

    if (h == null || w == null || b == null) {
        return [];
    }

    const rgb: number[] = hwb2srgb(h, w, b);

    if (a != null && a != 1) {
        rgb.push(a);
    }

    return rgb;
}
/**
 * convert hwb to sRGB
 */
export function hwb2srgb(
    h: number,
    w: number,
    b: number,
    alpha?: number,
): [number, number, number] | [number, number, number, number] {
    const wNorm = w / 100;
    const bNorm = b / 100;

    if (wNorm + bNorm >= 1) {
        const gray = wNorm / (wNorm + bNorm);
        return [Math.round(gray * 10000) / 10000, Math.round(gray * 10000) / 10000, Math.round(gray * 10000) / 10000];
    }

    const hPrime = (h % 360) / 60;
    const x = 1 - Math.abs((hPrime % 2) - 1);

    let rChroma = 0;
    let gChroma = 0;
    let bChroma = 0;

    if (hPrime >= 0 && hPrime < 1) {
        [rChroma, gChroma, bChroma] = [1, x, 0];
    } else if (hPrime >= 1 && hPrime < 2) {
        [rChroma, gChroma, bChroma] = [x, 1, 0];
    } else if (hPrime >= 2 && hPrime < 3) {
        [rChroma, gChroma, bChroma] = [0, 1, x];
    } else if (hPrime >= 3 && hPrime < 4) {
        [rChroma, gChroma, bChroma] = [0, x, 1];
    } else if (hPrime >= 4 && hPrime < 5) {
        [rChroma, gChroma, bChroma] = [x, 0, 1];
    } else if (hPrime >= 5 && hPrime <= 6) {
        [rChroma, gChroma, bChroma] = [1, 0, x];
    }

    const factor = 1 - wNorm - bNorm;

    const srgb = [rChroma * factor + wNorm, gChroma * factor + wNorm, bChroma * factor + wNorm];

    if (alpha != null && alpha != 1) {
        srgb.push(alpha);
    }

    return srgb as [number, number, number] | [number, number, number, number];
}

export function hsl2srgb(token: ColorToken): number[] | null {
    let { h, s, l, a } = hslvalues(token) ?? {};

    if (h == null || s == null || l == null) {
        return null;
    }

    // hue in degrees
    return hslvalues2srgbvalues(h, s, l, a);
}

export function cmyk2srgbvalues(token: ColorToken): number[] | null {
    const components: Token[] | null = getColorComponents(token);

    if (components == null) {
        return null;
    }

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
    const mul = 1 - k;

    const rgb: number[] = [1 - Math.min(1, c * mul + k), 1 - Math.min(1, m * mul + k), 1 - Math.min(1, y * mul + k)];

    if (components.length == 5) {
        rgb.push(getNumber(components[4] as NumberToken | PercentageToken));
    }

    return rgb;
}

export function oklab2srgbvalues(token: ColorToken): number[] | null {
    const [l, a, b, alpha] = getOKLABComponents(token) ?? [];

    if (l == null || a == null || b == null) {
        return null;
    }

    const rgb: number[] = OKLab_to_sRGB(l, a, b);

    if (alpha != null && alpha != 1) {
        rgb.push(alpha);
    }

    return rgb;
}

export function oklch2srgbvalues(token: ColorToken): number[] | null {
    const [l, c, h, alpha] = getOKLCHComponents(token) ?? [];

    if (l == null || c == null || h == null) {
        return null;
    }

    const values = lchvalues2labvalues(l, c, h);
    const rgb: number[] = OKLab_to_sRGB(values[0], values[1], values[2]);

    if (alpha != 1) {
        rgb.push(alpha);
    }

    return rgb;
}

export function hslvalues(token: ColorToken): { h: number; s: number; l: number; a?: number | null } | null {
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
    let s: number = getNumber(t);
    // @ts-ignore
    t = <NumberToken | DimensionToken>components[2];
    // @ts-ignore
    let l: number = getNumber(t);

    if (components[1].typ == EnumToken.PercentageTokenType) {
        s *= 100;
    }

    if (components[2].typ == EnumToken.PercentageTokenType) {
        l *= 100;
    }

    let a = null;

    if (components.length == 4) {
        // @ts-ignore
        t = components[3];

        // @ts-ignore
        a = getNumber(t);
    }

    return a == null ? { h, s, l } : { h, s, l, a };
}

export function hslvalues2srgbvalues(h: number, s: number, l: number, a: number | null = null): number[] {
    const sNorm = s / 100;
    const lNorm = l / 100;

    const chroma = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const hPrime = h / 60;
    const x = chroma * (1 - Math.abs((hPrime % 2) - 1));

    let rTmp = 0;
    let gTmp = 0;
    let bTmp = 0;

    if (hPrime >= 0 && hPrime < 1) {
        [rTmp, gTmp, bTmp] = [chroma, x, 0];
    } else if (hPrime >= 1 && hPrime < 2) {
        [rTmp, gTmp, bTmp] = [x, chroma, 0];
    } else if (hPrime >= 2 && hPrime < 3) {
        [rTmp, gTmp, bTmp] = [0, chroma, x];
    } else if (hPrime >= 3 && hPrime < 4) {
        [rTmp, gTmp, bTmp] = [0, x, chroma];
    } else if (hPrime >= 4 && hPrime < 5) {
        [rTmp, gTmp, bTmp] = [x, 0, chroma];
    } else if (hPrime >= 5 && hPrime <= 6) {
        [rTmp, gTmp, bTmp] = [chroma, 0, x];
    }

    const m = lNorm - chroma / 2;

    const values = [rTmp + m, gTmp + m, bTmp + m];

    if (a != null) {
        values.push(a);
    }

    // Return exact float decimals instead of multiplying by 255
    return values;
}

export function lab2srgbvalues(token: ColorToken): number[] | null {
    const [l, a, b, alpha] = getLABComponents(token) ?? [];

    if (l == null || a == null || b == null) {
        return null;
    }

    const rgb: number[] = Lab_to_sRGB(l, a, b);

    if (alpha != null && alpha < 1) {
        rgb.push(alpha);
    }

    return rgb;
}

export function lch2srgbvalues(token: ColorToken): number[] | null {
    const components: number[] | null = getLCHComponents(token);

    if (components == null) {
        return null;
    }

    // @ts-ignore
    const [l, a, b, alpha] = lchvalues2labvalues(components[0], components[1], components[2], components[3]);

    if (l == null || a == null || b == null) {
        return null;
    }

    // https://www.w3.org/TR/css-color-4/#lab-to-lch
    const rgb: number[] = Lab_to_sRGB(l, a, b);

    if (alpha != 1) {
        rgb.push(alpha);
    }

    return rgb;
}

// sRGB -> lRGB
export function srgb2lsrgbvalues(r: number, g: number, b: number, a: number | null = null): number[] {
    // convert an array of linear-light sRGB values in the range 0.0-1.0
    // to gamma corrected form
    // https://en.wikipedia.org/wiki/SRGB
    // Extended transfer function:
    // For negative values, linear portion extends on reflection
    // of axis, then uses reflected pow below that
    const rgb: number[] = [r, g, b].map((val: number): number => {
        const abs: number = Math.abs(val);
        if (abs <= 0.04045) {
            return val / 12.92;
        }
        return (Math.sign(val) || 1) * Math.pow((abs + 0.055) / 1.055, 2.4);
    });

    if (a != 1 && a != null) {
        rgb.push(a);
    }

    return rgb;
}

export function lsrgb2srgbvalues(r: number, g: number, b: number, alpha: number | null = null): number[] {
    // convert an array of linear-light sRGB values in the range 0.0-1.0
    // to gamma corrected form
    // https://en.wikipedia.org/wiki/SRGB
    // Extended transfer function:
    // For negative values, linear portion extends on reflection
    // of axis, then uses reflected pow below that
    const rgb: number[] = [r, g, b].map((val: number): number => {
        let abs: number = Math.abs(val);

        if (Math.abs(val) > 0.0031308) {
            return (Math.sign(val) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
        }

        return 12.92 * val;
    });

    if (alpha != 1 && alpha != null) {
        rgb.push(alpha);
    }

    return rgb;
}
