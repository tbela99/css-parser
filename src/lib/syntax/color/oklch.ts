import type { Token } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
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

export function hex2oklchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hex2oklchvalues(arena, token);

    return values == null ? null : oklchToken(arena, values);
}

export function rgb2oklchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = rgb2oklchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return oklchToken(arena, values);
}

export function hsl2oklchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hsl2oklchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return oklchToken(arena, values);
}

export function hwb2oklchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hwb2oklchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return oklchToken(arena, values);
}

export function cmyk2oklchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = cmyk2oklchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return oklchToken(arena, values);
}

export function lab2oklchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = lab2oklchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return oklchToken(arena, values);
}

export function oklab2oklchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = oklab2oklchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return oklchToken(arena, values);
}

export function lch2oklchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = lch2oklchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return oklchToken(arena, values);
}

export function color2oklchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = color2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return oklchToken(arena, srgb2oklch(values[0], values[1], values[2], values[3]));
}

function oklchToken(arena: AstArena, values: number[]): Token | null {

    const chi: Token[] = <Token[]>[
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.NumberTokenType, values[1]),
        arena.createToken(EnumToken.NumberTokenType, values[2]),
    ];

    if (values.length === 4) {
        chi.push(
            arena.createToken(EnumToken.LiteralTokenType, "/"),
            arena.createToken(EnumToken.PercentageTokenType, values[3] * 100),
        );
    }

    return arena.createColor("oklch", ColorType.OKLCH, chi);
}

export function hex2oklchvalues(arena: AstArena, token: Token): number[] | null {
    const values = hex2oklabvalues(arena, token);
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function rgb2oklchvalues(arena: AstArena, token: Token): number[] | null {
    const values = rgb2oklabvalues(arena, token);

    if (values == null) {
        return null;
    }

    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function hsl2oklchvalues(arena: AstArena, token: Token): number[] | null {
    const values = hsl2oklabvalues(arena, token);
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function hwb2oklchvalues(arena: AstArena, token: Token): number[] {
    const values = hwb2oklabvalues(arena, token) as number[];
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function cmyk2oklchvalues(arena: AstArena, token: Token): number[] | null {
    const values = cmyk2srgbvalues(arena, token);

    return values == null ? null : srgb2oklch(values[0], values[1], values[2], values[3]);
}

export function lab2oklchvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = lab2oklabvalues(arena, token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function lch2oklchvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = lch2oklabvalues(arena, token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function oklab2oklchvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = getOKLABComponents(arena, token);

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

export function getOKLCHComponents(arena: AstArena, token: Token): number[] | null {
    const components: Token[] | null = getColorComponents(arena, token);

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
            ].includes(arena.dataTypes[components[i]])
        ) {
            return [];
        }
    }

    // @ts-ignore
    let t: Token = components[0];

    // @ts-ignore
    const l: number = getNumber(arena, t);

    // @ts-ignore
    t = components[1];

    // @ts-ignore
    const c: number = getNumber(arena, t) * (arena.dataTypes[t] === EnumToken.PercentageTokenType ? 0.4 : 1);

    // @ts-ignore
    t = components[2];

    // @ts-ignore
    const h: number = getAngle(arena, t) * 360;

    // @ts-ignore
    t = components[3];

    const alpha: number =
        t == null || (arena.dataTypes[t] === EnumToken.IdenTokenType && arena.strings[arena.stringValue[t]] === "none")
            ? 1
            : getNumber(arena, t);

    return [l, c, h, alpha];
}
