import type {ColorToken, Token} from "../../../@types/token.d.ts";
import {ColorType, EnumToken} from "../../ast/index.ts";
import {color2srgbvalues} from "./color.ts";
import {
    hwb2srgbvalues,
    lab2srgbvalues,
    lch2srgbvalues,
    oklab2srgbvalues,
    oklch2srgbvalues,
    rgb2srgbvalues
} from "./srgb.ts";
import {hsl2srgbvalues} from "./rgb.ts";

export function rgb2cmykToken(token: ColorToken): ColorToken | null {

    const components: number[] | null = rgb2srgbvalues(token);

    if (components == null || components.length < 3) {
        return null;
    }

    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...components));
}

export function hsl2cmykToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = hsl2srgbvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...values));
}

export function hwb2cmykToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = hwb2srgbvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...values));
}

export function lab2cmykToken(token: ColorToken): ColorToken | null {

    const components: number[] | null = lab2srgbvalues(token);

    if (components == null || components.length < 3) {
        return null;
    }

    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...components));
}

export function lch2cmykToken(token: ColorToken): ColorToken | null {

    const components: number[] | null = lch2srgbvalues(token);

    if (components == null || components.length < 3) {
        return null;
    }

    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...components));
}

export function oklab2cmyk(token: ColorToken): ColorToken | null {

    const components: number[] | null = oklab2srgbvalues(token);

    if (components == null || components.length < 3) {
        return null;
    }

    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...components));
}

export function oklch2cmykToken(token: ColorToken): ColorToken | null {

    const components: number[] | null = oklch2srgbvalues(token);

    if (components == null || components.length < 3) {
        return null;
    }

    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...components));
}

export function color2cmykToken(token: ColorToken): ColorToken | null {

    const values = color2srgbvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return cmyktoken(srgb2cmykvalues(...values));
}

export function srgb2cmykvalues(r: number, g: number, b: number, a: number | null = null): number[] {

    const k: number = 1 - Math.max(r, g, b);
    const c: number = k == 1 ? 0 : (1 - r - k) / (1 - k);
    const m: number = k == 1 ? 0 : (1 - g - k) / (1 - k);
    const y: number = k == 1 ? 0 : (1 - b - k) / (1 - k);

    const result: number[] = [c, m, y, k];
    if (a != null && a < 1) {
        result.push(a);
    }

    return result;
}
function cmyktoken(values: number[]): ColorToken {

    return {
        typ: EnumToken.ColorTokenType,
        val: 'device-cmyk',
        chi: values.reduce((acc: Token[], curr: number, index: number) => index < 4 ? [...acc, {
            typ: EnumToken.PercentageTokenType,
            // @ts-ignore
            val: (curr * 100) + ''
        } as Token] : [...acc, {
            typ: EnumToken.LiteralTokenType,
            val: '/'
        } as Token, {typ: EnumToken.PercentageTokenType, val: (curr * 100).toFixed()} as Token], [] as Token[]) as Token[],
        kin: ColorType.DEVICE_CMYK
    }
}
