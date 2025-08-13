import type {ColorToken, NumberToken, PercentageToken, Token} from "../../../@types/index.d.ts";
import {getComponents} from "./utils/index.ts";
import {color2srgbvalues, getAngle, getNumber, toPrecisionAngle} from "./color.ts";
import {ColorType, EnumToken} from "../../ast/index.ts";
import {labvalues2lchvalues} from "./lch.ts";
import {
    getOKLABComponents,
    hex2oklabvalues,
    hsl2oklabvalues,
    hwb2oklabvalues,
    lab2oklabvalues,
    lch2oklabvalues,
    rgb2oklabvalues,
    srgb2oklab
} from "./oklab.ts";
import {cmyk2srgbvalues} from "./srgb.ts";

export function hex2oklchToken(token: ColorToken): ColorToken | null {

    const values: number[] = hex2oklchvalues(token);

    return oklchToken(values);
}

export function rgb2oklchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = rgb2oklchvalues(token);

    if (values == null) {
        return null;
    }

    return oklchToken(values);
}

export function hsl2oklchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = hsl2oklchvalues(token);

    if (values == null) {
        return null;
    }

    return oklchToken(values);
}

export function hwb2oklchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = hwb2oklchvalues(token);

    if (values == null) {
        return null;
    }

    return oklchToken(values);
}

export function cmyk2oklchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = cmyk2oklchvalues(token);

    if (values == null) {
        return null;
    }

    return oklchToken(values);
}

export function lab2oklchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = lab2oklchvalues(token);

    if (values == null) {
        return null;
    }

    return oklchToken(values);
}

export function oklab2oklchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = oklab2oklchvalues(token);

    if (values == null) {
        return null;
    }

    return oklchToken(values);
}

export function lch2oklchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = lch2oklchvalues(token);

    if (values == null) {
        return null;
    }

    return oklchToken(values);
}

export function color2oklchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = color2srgbvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return oklchToken(srgb2oklch(...values));
}

function oklchToken(values: number[]): ColorToken | null {

    values[2] = toPrecisionAngle(values[2]);

    const chi: Token[] = <Token[]>[

        {typ: EnumToken.NumberTokenType, val: values[0]},
        {typ: EnumToken.NumberTokenType, val: values[1]},
        {typ: EnumToken.NumberTokenType, val: values[2]},
    ];

    if (values.length == 4) {

        chi.push({typ: EnumToken.LiteralTokenType, val: '/'}, {
            typ: EnumToken.PercentageTokenType,
            val: values[3] * 100
        });
    }

    return {
        typ: EnumToken.ColorTokenType,
        val: 'oklch',
        chi,
        kin: ColorType.OKLCH
    }
}

export function hex2oklchvalues(token: ColorToken): number[] {

    // @ts-ignore
    return labvalues2lchvalues(...hex2oklabvalues(token));
}

export function rgb2oklchvalues(token: ColorToken): number[] | null {

    const values = rgb2oklabvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return labvalues2lchvalues(...values);
}

export function hsl2oklchvalues(token: ColorToken): number[] {

    // @ts-ignore
    return labvalues2lchvalues(...hsl2oklabvalues(token));
}

export function hwb2oklchvalues(token: ColorToken): number[] {

    // @ts-ignore
    return labvalues2lchvalues(...hwb2oklabvalues(token));
}

export function cmyk2oklchvalues(token: ColorToken): number[] {

    const values = cmyk2srgbvalues(token);

    // @ts-ignore
    return values == null ? null : srgb2oklch(...values);
}

export function lab2oklchvalues(token: ColorToken): number[] {

    // @ts-ignore
    return labvalues2lchvalues(...lab2oklabvalues(token));
}

export function lch2oklchvalues(token: ColorToken): number[] {

    // @ts-ignore
    return labvalues2lchvalues(...lch2oklabvalues(token));
}

export function oklab2oklchvalues(token: ColorToken): number[] {

    // @ts-ignore
    return labvalues2lchvalues(...getOKLABComponents(token));
}

export function srgb2oklch(r: number, g: number, blue: number, alpha: number | null): number[] {

    // @ts-ignore
    return labvalues2lchvalues(...srgb2oklab(r, g, blue, alpha));
}

export function getOKLCHComponents(token: ColorToken): number[] | null {

    const components: Token[] | null = getComponents(token);

    if (components == null) {

        return null;
    }

    for (let i = 0; i < components.length; i++) {

        if (![EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.AngleTokenType, EnumToken.IdenTokenType].includes(components[i].typ)) {

            return [];
        }
    }

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
    const h: number = getAngle(t) * 360;

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[3];

    // @ts-ignore
    const alpha: number = t == null || (t.typ == EnumToken.IdenTokenType && t.val == 'none') ? 1 : getNumber(t);

    return [l, c, h, alpha];
}