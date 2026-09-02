import type { ColorToken, NumberToken, PercentageToken, Token } from "../../../@types/index.d.ts";
import { getColorComponents } from "./utils/components.ts";
import { color2srgbvalues, getAngle, getNumber } from "./color.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import { labvalues2lchvalues } from "./lch.ts";
import {
    getOKLABComponents,
    hex2oklabvalues,
    hsl2oklabvalues,
    hwb2oklabvalues,
    lab2oklabvalues,
    lch2oklabvalues,
    rgb2oklabvalues,
    srgb2oklab,
} from "./oklab.ts";
import { cmyk2srgbvalues } from "./srgb.ts";

export function hex2oklchToken(token: ColorToken): ColorToken | null {
    const values: number[] | null = hex2oklchvalues(token);

    return values == null ? null : oklchToken(values);
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

    return oklchToken(srgb2oklch(values[0], values[1], values[2], values[3]));
}

function oklchToken(values: number[]): ColorToken | null {
    values[2] = values[2];

    const chi: Token[] = <Token[]>[
        { typ: EnumToken.NumberTokenType, val: values[0] },
        { typ: EnumToken.NumberTokenType, val: values[1] },
        { typ: EnumToken.NumberTokenType, val: values[2] },
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
        val: "oklch",
        chi,
        kin: ColorType.OKLCH,
    };
}

export function hex2oklchvalues(token: ColorToken): number[] | null {
    const values = hex2oklabvalues(token);
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function rgb2oklchvalues(token: ColorToken): number[] | null {
    const values = rgb2oklabvalues(token);

    if (values == null) {
        return null;
    }

    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function hsl2oklchvalues(token: ColorToken): number[] | null {
    const values = hsl2oklabvalues(token);
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function hwb2oklchvalues(token: ColorToken): number[] {
    const values = hwb2oklabvalues(token) as number[];
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function cmyk2oklchvalues(token: ColorToken): number[] | null {
    const values = cmyk2srgbvalues(token);

    return values == null ? null : srgb2oklch(values[0], values[1], values[2], values[3]);
}

export function lab2oklchvalues(token: ColorToken): number[] | null {
    const values: number[] | null = lab2oklabvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function lch2oklchvalues(token: ColorToken): number[] | null {
    const values: number[] | null = lch2oklabvalues(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function oklab2oklchvalues(token: ColorToken): number[] | null {
    const values: number[] | null = getOKLABComponents(token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function srgb2oklch(r: number, g: number, blue: number, alpha: number | null): number[] {
    const values = srgb2oklab(r, g, blue, alpha);
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function getOKLCHComponents(token: ColorToken): number[] | null {
    const components: Token[] | null = getColorComponents(token);

    if (components == null) {
        return null;
    }

    for (let i = 0; i < components.length; i++) {
        if (
            ![
                EnumToken.NumberTokenType,
                EnumToken.PercentageTokenType,
                EnumToken.AngleTokenType,
                EnumToken.IdenTokenType,
            ].includes(components[i].typ)
        ) {
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
    const c: number = getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 0.4 : 1);

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[2];

    // @ts-ignore
    const h: number = getAngle(t) * 360;

    // @ts-ignore
    t = <NumberToken | PercentageToken>components[3];

    // @ts-ignore
    const alpha: number = t == null || (t.typ == EnumToken.IdenTokenType && t.val == "none") ? 1 : getNumber(t);

    return [l, c, h, alpha];
}
