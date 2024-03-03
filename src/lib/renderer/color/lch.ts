import {ColorToken, NumberToken, PercentageToken, Token} from "../../../@types";
import {getComponents} from "./utils";
import {getAngle, getNumber} from "./color";
import {EnumToken} from "../../ast";
import {getLABComponents, hex2lab, hsl2lab, hwb2lab, oklab2lab, oklch2lab, rgb2lab} from "./lab";

export function hex2lch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...hex2lab(token));
}

export function rgb2lch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...rgb2lab(token));
}

export function hsl2lch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...hsl2lab(token));
}

export function hwb2lch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...hwb2lab(token));
}

export function lab2lch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...getLABComponents(token));
}

export function oklab2lch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...oklab2lab(token));
}

export function oklch2lch(token: ColorToken): number[] {

    // @ts-ignore
    return lab2lchvalues(...oklch2lab(token));
}

export function lab2lchvalues(l: number, a: number, b: number, alpha: number | null = null): number[] {

    const c: number = Math.sqrt(a * a + b * b);
    const h: number = Math.atan2(b, a) * 180 / Math.PI;

    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}

export function getLCHComponents(token: ColorToken): number[] {

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

    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}