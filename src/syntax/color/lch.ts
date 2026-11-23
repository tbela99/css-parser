import type { Token } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { getColorComponents } from "./utils/components.ts";
import { color2srgbvalues, getAngle, getNumber } from "./color.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import {
    getLABComponents,
    hex2labvalues,
    hsl2labvalues,
    hwb2labvalues,
    oklab2labvalues,
    oklch2labvalues,
    rgb2labvalues,
    srgb2labvalues,
    xyz2lab,
} from "./lab.ts";
import { cmyk2srgbvalues } from "./srgb.ts";
import { epsilon } from "../constants.ts";

export function hex2lchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hex2lchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return lchToken(arena, values);
}

export function rgb2lchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = rgb2lchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return lchToken(arena, values);
}

export function hsl2lchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hsl2lchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return lchToken(arena, values);
}

export function hwb2lchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hwb2lchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return lchToken(arena, values);
}

export function cmyk2lchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = cmyk2lchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return lchToken(arena, values);
}

export function lab2lchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = lab2lchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return lchToken(arena, values);
}

export function oklab2lchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = oklab2lchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return lchToken(arena, values);
}

export function oklch2lchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = oklch2lchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return lchToken(arena, values);
}

export function color2lchToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = color2lchvalues(arena, token);

    if (values == null) {
        return null;
    }

    return lchToken(arena, values);
}

function lchToken(arena: AstArena, values: number[]): Token | null {
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

    return arena.createColor("lch", ColorType.LCH, chi);
}

export function hex2lchvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = hex2labvalues(arena, token);

    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function rgb2lchvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = rgb2labvalues(arena, token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function hsl2lchvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = hsl2labvalues(arena, token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function hwb2lchvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = hwb2labvalues(arena, token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function lab2lchvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = getLABComponents(arena, token);

    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function srgb2lch(r: number, g: number, blue: number, alpha: number | null): number[] {
    let values = srgb2labvalues(r, g, blue, alpha);
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function oklab2lchvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = oklab2labvalues(arena, token);
    // @ts-ignore
    return values == null ? null : labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function cmyk2lchvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = cmyk2srgbvalues(arena, token);
    // @ts-ignore
    return values == null ? null : srgb2lch(values[0], values[1], values[2], values[3]);
}

export function oklch2lchvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = oklch2labvalues(arena, token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return labvalues2lchvalues(values[0], values[1], values[2], values[3]);
}

export function color2lchvalues(arena: AstArena, token: Token): number[] | null {
    const values = color2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return srgb2lch(values[0], values[1], values[2], values[3]);
}

export function labvalues2lchvalues(l: number, a: number, b: number, alpha: number | null = null): number[] {
    const c: number = Math.sqrt(a * a + b * b);
    let h: number = (Math.atan2(b, a) * 180) / Math.PI;

    if (h >= -epsilon && h <= epsilon) {
        h = 0;
    } else if (h < 0) {
        h += 360;
    }

    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}

export function xyz2lchvalues(x: number, y: number, z: number, alpha?: number): number[] {
    const values = xyz2lab(x, y, z);
    const lch = labvalues2lchvalues(values[0], values[1], values[2]);

    return alpha == null || alpha === 1 ? lch : lch.concat(alpha);
}

export function getLCHComponents(arena: AstArena, token: Token): number[] | null {
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
            return null;
        }
    }

    // @ts-ignore
    let t: Token = components[0];

    // @ts-ignore
    const l: number = getNumber(arena, t) * (arena.dataTypes[t] === EnumToken.PercentageTokenType ? 100 : 1);

    // @ts-ignore
    t = components[1];

    // @ts-ignore
    const c: number = getNumber(arena, t) * (arena.dataTypes[t] === EnumToken.PercentageTokenType ? 150 : 1);

    // @ts-ignore
    t = components[2];

    // @ts-ignore
    const h: number = getAngle(arena, t) * 360;

    // @ts-ignore
    t = components[3];

    // @ts-ignore
    const alpha: number = t == null ? 1 : getNumber(arena, t);

    return alpha == null ? [l, c, h] : [l, c, h, alpha];
}
