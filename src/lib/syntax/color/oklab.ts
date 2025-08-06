import {getComponents, multiplyMatrices} from "./utils/index.ts";
import {
    cmyk2srgbvalues,
    hex2srgbvalues,
    hsl2srgb,
    hwb2srgbvalues,
    lab2srgbvalues,
    lch2srgbvalues,
    lsrgb2srgbvalues,
    rgb2srgb,
    srgb2lsrgbvalues
} from "./srgb.ts";
import type {ColorToken, NumberToken, PercentageToken, Token} from "../../../@types/index.d.ts";
import {color2srgbvalues, getNumber} from "./color.ts";
import {ColorType, EnumToken} from "../../ast/index.ts";
import {getOKLCHComponents} from "./oklch.ts";
import {lchvalues2labvalues} from "./lab.ts";

export function hex2oklabToken(token: ColorToken): ColorToken | null {

    const values = hex2oklabvalues(token);

    if (values == null) {
        return null;
    }

    return oklabToken(values);
}

export function rgb2oklabToken(token: ColorToken): ColorToken | null {

    const values = rgb2oklabvalues(token);

    if (values == null) {
        return null;
    }

    return oklabToken(values);
}

export function hsl2oklabToken(token: ColorToken): ColorToken | null {

    const values = hsl2oklabvalues(token);

    if (values == null) {
        return null;
    }

    return oklabToken(values);
}

export function hwb2oklabToken(token: ColorToken): ColorToken | null {

    const values = hwb2oklabvalues(token);

    if (values == null) {
        return null;
    }

    return oklabToken(values);
}

export function cmyk2oklabToken(token: ColorToken): ColorToken | null {

    const values = cmyk2oklabvalues(token);

    if (values == null) {
        return null;
    }

    return oklabToken(values);
}

export function lab2oklabToken(token: ColorToken): ColorToken | null {

    const values = lab2oklabvalues(token);

    if (values == null) {
        return null;
    }

    return oklabToken(values);
}

export function lch2oklabToken(token: ColorToken): ColorToken | null {

    const values = lch2oklabvalues(token);

    if (values == null) {
        return null;
    }

    return oklabToken(values);
}

export function oklch2oklabToken(token: ColorToken): ColorToken | null {

    const values = oklch2oklabvalues(token);

    if (values == null) {
        return null;
    }

    return oklabToken(values);
}

export function color2oklabToken(token: ColorToken): ColorToken | null {

    const values: number[] | null = color2oklabvalues(token);

    if (values == null) {
        return null;
    }

    return oklabToken(values);
}

function oklabToken(values: number[]): ColorToken | null {

    const chi: Token[] = <Token[]>[

        {typ: EnumToken.NumberTokenType, val: String(values[0])},
        {typ: EnumToken.NumberTokenType, val: String(values[1])},
        {typ: EnumToken.NumberTokenType, val: String(values[2])},
    ];

    if (values.length == 4) {

        chi.push({typ: EnumToken.LiteralTokenType, val: '/'}, {
            typ: EnumToken.PercentageTokenType,
            val: (values[3] * 100).toFixed()
        });
    }

    return {
        typ: EnumToken.ColorTokenType,
        val: 'oklab',
        chi,
        kin: ColorType.OKLAB
    }
}

export function hex2oklabvalues(token: ColorToken): number[] | null {

    const values = hex2srgbvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return srgb2oklab(...values);
}

export function rgb2oklabvalues(token: ColorToken) {

    const values = rgb2srgb(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return srgb2oklab(...values);
}

export function hsl2oklabvalues(token: ColorToken) {

    const values = hsl2srgb(token);

    if (values == null) {
        return null;
    }
    // @ts-ignore
    return srgb2oklab(...values);
}

export function hwb2oklabvalues(token: ColorToken): number[] {

    // @ts-ignore
    return srgb2oklab(...hwb2srgbvalues(token));
}

export function cmyk2oklabvalues(token: ColorToken) {

    const values = cmyk2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2oklab(...values);
}

export function lab2oklabvalues(token: ColorToken) {

    const values: number[] | null = lab2srgbvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return srgb2oklab(...values);
}

export function lch2oklabvalues(token: ColorToken): number[] | null {

    const values = lch2srgbvalues(token);
    // @ts-ignore
    return values == null ? null : srgb2oklab(...values);
}

export function oklch2oklabvalues(token: ColorToken): number[] | null {

    const values: number[] | null = getOKLCHComponents(token);
    // @ts-ignore
    return values == null ? null : lchvalues2labvalues(...values);
}

function color2oklabvalues(token: ColorToken): number[] | null {

    const values = color2srgbvalues(token);

    // @ts-ignore
    return values == null ? null : srgb2oklab(...values);
}

export function srgb2oklab(r: number, g: number, blue: number, alpha: number | null): number[] {

    [r, g, blue] = srgb2lsrgbvalues(r, g, blue);

    let L: number = Math.cbrt(
        0.41222147079999993 * r + 0.5363325363 * g + 0.0514459929 * blue
    );
    let M: number = Math.cbrt(
        0.2119034981999999 * r + 0.6806995450999999 * g + 0.1073969566 * blue
    );
    let S: number = Math.cbrt(
        0.08830246189999998 * r + 0.2817188376 * g + 0.6299787005000002 * blue
    );

    const l: number = 0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S;

    const a: number = r == g && g == blue ? 0 : 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S;

    const b: number = r == g && g == blue ? 0 : 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S;

    return alpha == null || alpha == 1 ? [l, a, b] : [l, a, b, alpha];
}

export function getOKLABComponents(token: ColorToken): number[] | null {

    const components: Token[] | null = getComponents(token);

    if (components == null || components.length < 3) {

        return null;
    }

    // @ts-ignore
    let t: NumberToken | PercentageToken = <NumberToken | PercentageToken>components[0];

    // @ts-ignore
    const l: number = getNumber(t);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[1];

    // @ts-ignore
    const a: number = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? .4 : 1);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[2];

    // @ts-ignore
    const b: number = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? .4 : 1);

    // @ts-ignore
    let alpha: number | null = null;

    if (components.length > 3) {

        alpha = getNumber(components[3] as NumberToken);
    }

    const rgb: number[] = [l, a, b];

    if (alpha != 1 && alpha != null) {

        rgb.push(alpha);
    }

    return rgb;
}

export function OKLab_to_XYZ(l: number, a: number, b: number, alpha: number | null = null): number[] {


    // Given OKLab, convert to XYZ relative to D65
    const LMStoXYZ: number[][] = [
        [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
        [-0.0405757452148008, 1.1122868032803170, -0.0717110580655164],
        [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
    ];
    const OKLabtoLMS: number[][] = [
        [1.0000000000000000, 0.3963377773761749, 0.2158037573099136],
        [1.0000000000000000, -0.1055613458156586, -0.0638541728258133],
        [1.0000000000000000, -0.0894841775298119, -1.2914855480194092]
    ];

    const LMSnl: number[] = multiplyMatrices(OKLabtoLMS, [l, a, b]);
    const xyz: number[] = multiplyMatrices(LMStoXYZ, LMSnl.map((c: number): number => c ** 3));

    if (alpha != null) {

        xyz.push(alpha);
    }

    return xyz;
}

// from https://www.w3.org/TR/css-color-4/#color-conversion-code
export function OKLab_to_sRGB(l: number, a: number, b: number): number[] {

    let L: number = Math.pow(
        l * 0.99999999845051981432 +
        0.39633779217376785678 * a +
        0.21580375806075880339 * b,
        3
    );
    let M: number = Math.pow(
        l * 1.0000000088817607767 -
        0.1055613423236563494 * a -
        0.063854174771705903402 * b,
        3
    );
    let S: number = Math.pow(
        l * 1.0000000546724109177 -
        0.089484182094965759684 * a -
        1.2914855378640917399 * b,
        3
    );

    return lsrgb2srgbvalues(
        /* r: */
        +4.076741661347994 * L -
        3.307711590408193 * M +
        0.230969928729428 * S,
        /*  g: */
        -1.2684380040921763 * L +
        2.6097574006633715 * M -
        0.3413193963102197 * S,
        /*  b: */
        -0.004196086541837188 * L -
        0.7034186144594493 * M +
        1.7076147009309444 * S
    );
}
