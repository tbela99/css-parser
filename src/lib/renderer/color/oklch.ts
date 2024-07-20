import {ColorToken, NumberToken, PercentageToken, Token} from "../../../@types/index.d.ts";
import {getComponents, powerlessColorComponent} from "./utils";
import {getAngle, getNumber} from "./color";
import {EnumToken} from "../../ast";
import {lab2lchvalues} from "./lch";
import {
    getOKLABComponents,
    hex2oklab,
    hsl2oklab,
    hwb2oklab,
    lab2oklab,
    lch2oklab,
    rgb2oklab,
    srgb2oklab
} from "./oklab";
import {eq} from "../../parser/utils/eq";

export function hex2oklch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...hex2oklab(token));
}

export function rgb2oklch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...rgb2oklab(token));
}

export function hsl2oklch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...hsl2oklab(token));
}

export function hwb2oklch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...hwb2oklab(token));
}

export function lab2oklch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...lab2oklab(token));
}

export function lch2oklch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...lch2oklab(token));
}

export function oklab2oklch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...getOKLABComponents(token));
}

export function srgb2oklch(r: number, g: number, blue: number, alpha: number | null): number[] {

    // @ts-ignore
    return lab2lchvalues(...srgb2oklab(r, g, blue, alpha));
}

export function getOKLCHComponents(token: ColorToken): number[] {

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
    const h: number = getAngle(t) * 360;

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[3];

    // @ts-ignore
    const alpha: number = t == null || (t.typ == EnumToken.IdenTokenType && t.val == 'none') ? 1 : getNumber(t);

    return [l, c, h, alpha];
}