import type {ColorToken, NumberToken, PercentageToken, Token} from "../../../@types/index.d.ts";
import {getComponents} from "./utils/index.ts";
import {color2srgbvalues, getAngle, getNumber, toPrecisionAngle} from "./color.ts";
import {ColorType, EnumToken} from "../../ast/index.ts";
import {
    getLABComponents,
    hex2labvalues,
    hsl2labvalues,
    hwb2labvalues,
    oklab2labvalues,
    oklch2labvalues,
    rgb2labvalues,
    srgb2labvalues,
    xyz2lab
} from "./lab.ts";
import {cmyk2srgbvalues} from "./srgb.ts";

export function hex2lchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = hex2lchvalues(token);

    if (values == null) {
        return null;
    }

    return lchToken(values);
}

export function rgb2lchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = rgb2lchvalues(token);

    if (values == null) {
        return null;
    }

    return lchToken(values);
}

export function hsl2lchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = hsl2lchvalues(token);

    if (values == null) {
        return null;
    }

    return lchToken(values);
}

export function hwb2lchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = hwb2lchvalues(token);

    if (values == null) {
        return null;
    }

    return lchToken(values);
}

export function cmyk2lchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = cmyk2lchvalues(token);

    if (values == null) {
        return null;
    }

    return lchToken(values);
}

export function lab2lchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = lab2lchvalues(token);

    if (values == null) {
        return null;
    }

    return lchToken(values);
}

export function oklab2lchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = oklab2lchvalues(token);

    if (values == null) {
        return null;
    }

    return lchToken(values);
}

export function oklch2lchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = oklch2lchvalues(token);

    if (values == null) {
        return null;
    }

    return lchToken(values);
}

export function color2lchToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = color2lchvalues(token);

    if (values == null) {
        return null;
    }

    return lchToken(values);
}

function lchToken(values: number[]): ColorToken | null {

    values[2] = toPrecisionAngle(values[2]);

    const chi: Token[] = <Token[]>[

        {typ: EnumToken.NumberTokenType, val: String(values[0])},
        {typ: EnumToken.NumberTokenType, val: String(values[1])},
        {typ: EnumToken.NumberTokenType, val: String(values[2])},
    ];

    if (values.length == 4) {

        chi.push({typ: EnumToken.LiteralTokenType, val: '/'}, {typ: EnumToken.PercentageTokenType, val: (values[3] * 100).toFixed()});
    }

    return {
        typ: EnumToken.ColorTokenType,
        val: 'lch',
        chi,
        kin: ColorType.LCH
    }
}

export function hex2lchvalues(token: ColorToken): number[] | null {

    const values: number[] | null = hex2labvalues(token);

    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}

export function rgb2lchvalues(token: ColorToken): number[] | null {

    const values: number[] | null = rgb2labvalues(token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}

export function hsl2lchvalues(token: ColorToken): number[] | null {

    const values: number[] | null = hsl2labvalues(token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}

export function hwb2lchvalues(token: ColorToken): number[] | null {

    const values: number[] | null = hwb2labvalues(token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}

export function lab2lchvalues(token: ColorToken): number[] | null {

    const values: number[] | null = getLABComponents(token);

    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}

export function srgb2lch(r: number, g: number, blue: number, alpha: number | null): number[] {

    // @ts-ignore
    return labvalues2lchvalues(...srgb2labvalues(r, g, blue, alpha));
}

export function oklab2lchvalues(token: ColorToken): number[] | null {


    const values: number[] | null = oklab2labvalues(token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(...values);
}

export function cmyk2lchvalues(token: ColorToken): number[] | null {

    const values: number[] | null = cmyk2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2lch(...values);
}

export function oklch2lchvalues(token: ColorToken): number[] | null {

    const values: number[] | null = oklch2labvalues(token);

    if (values == null) {

        return null;
    }

    // @ts-ignore
    return labvalues2lchvalues(...values);
}

export function color2lchvalues(token: ColorToken): number[] | null {

    const values = color2srgbvalues(token);

    if (values == null) {

        return null;
    }

    // @ts-ignore
    return srgb2lch(...values);
}

export function labvalues2lchvalues(l: number, a: number, b: number, alpha: number | null = null): number[] {

    let c: number = Math.sqrt(a * a + b * b);
    let h: number = Math.atan2(b, a) * 180 / Math.PI;

    if (h < 0) {
        h += 360;
    }

    if (c < .0001) {
        c = h = 0;
    }

    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}

export function xyz2lchvalues(x: number, y: number, z: number, alpha?: number): number[] {

    // @ts-ignore(
    const lch = labvalues2lchvalues(...xyz2lab(x, y, z));

    return alpha == null || alpha == 1 ? lch : lch.concat(alpha);
}
export function getLCHComponents(token: ColorToken): number[] | null {

    const components: Token[] | null = getComponents(token);

    if (components == null) {

        return null;
    }

    for (let i = 0; i < components.length; i++) {

        if (![EnumToken.NumberTokenType, EnumToken.PercentageTokenType, EnumToken.AngleTokenType, EnumToken.IdenTokenType].includes(components[i].typ)) {

            return null;
        }
    }

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
    const h: number = getAngle(t) * 360;

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[3];

    // @ts-ignore
    const alpha: number = t == null ? 1 : getNumber(t);

    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}