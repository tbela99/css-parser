import type { AstArena } from "../../ast/arena.ts";
import type { Token } from "../../../@types/index.d.ts";
import { getColorComponents } from "./utils/components.ts";
import { color2srgbvalues, getAngle, getNumber } from "./color.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import {
    cmyk2srgbvalues,
    hslvalues,
    lab2srgbvalues,
    lch2srgbvalues,
    oklab2srgbvalues,
    oklch2srgbvalues,
} from "./srgb.ts";

export function rgb2hwbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = rgb2hwbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hwbToken(arena, values);
}

export function hsl2hwbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hsl2hwbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hwbToken(arena, values);
}

export function cmyk2hwbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = cmyk2hwbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hwbToken(arena, values);
}

export function oklab2hwbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = oklab2hwbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hwbToken(arena, values);
}

export function oklch2hwbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = oklch2hwbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hwbToken(arena, values);
}

export function lab2hwbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = lab2hwbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hwbToken(arena, values);
}

export function lch2hwbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = lch2hwbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hwbToken(arena, values);
}

export function color2hwbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = color2hwbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hwbToken(arena, values);
}

export function hwbToken(arena: AstArena, values: number[]): Token {
    const chi: Token[] = <Token[]>[
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.PercentageTokenType, values[1]),
        arena.createToken(EnumToken.PercentageTokenType, values[2]),
    ];

    if (values.length === 4) {
        chi.push(
            arena.createToken(EnumToken.LiteralTokenType, "/"),
            arena.createToken(EnumToken.PercentageTokenType, values[3] * 100),
        );
    }

    return arena.createColor("hwb", ColorType.HWB, chi);
}

export function rgb2hwbvalues(arena: AstArena, token: Token): number[] {
    const values = getColorComponents(arena, token)!.map((t: Token, index: number): number => {
        if (index === 3) {
            return getNumber(arena, t);
        }

        return getNumber(arena, t) / 255;
    }) as [number, number, number, number];

    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function cmyk2hwbvalues(arena: AstArena, token: Token): number[] | null {
    const values = cmyk2srgbvalues(arena, token);
    return values == null ? null : srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function hsl2hwbvalues(arena: AstArena, token: Token): number[] | null {
    const values = hslvalues(arena, token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return hslvalues2hwbvalues(values.h, values.s, values.l, values.a);
}

export function lab2hwbvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = lab2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function lch2hwbvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = lch2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function oklab2hwbvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = oklab2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function oklch2hwbvalues(arena: AstArena, token: Token): number[] {
    const values: number[] | null = oklch2srgbvalues(arena, token);
    // @ts-ignore
    return values == null ? null : srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function color2hwbvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = color2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return srgb2hwb(values[0], values[1], values[2], values[3]);
}

export function hwbvalues(
    arena: AstArena,
    token: Token,
): { h: number; w: number; b: number; a?: number | null } | null {
    const components: Token[] | null = getColorComponents(arena, token);

    if (components == null) {
        return null;
    }

    let t: Token;

    // @ts-ignore
    let h: number = getAngle(arena, components[0]) * 360;

    // @ts-ignore
    t = components[1];
    // @ts-ignore
    let w: number = getNumber(arena, t);
    // @ts-ignore
    t = components[2];
    // @ts-ignore
    let b: number = getNumber(arena, t);

    // if (arena.dataTypes[components[1]] == EnumToken.NumberTokenType) {
    w *= 100;
    // }

    // if (arena.dataTypes[components[2]] == EnumToken.NumberTokenType) {
    b *= 100;
    // }

    let a = null;

    if (components.length === 4) {
        // @ts-ignore
        t = components[3];

        // @ts-ignore
        a = getNumber(arena, t);
    }

    return a == null ? { h, w, b } : { h, w, b, a };
}

export function srgb2hwb(r: number, g: number, b: number, a: number | null = null): number[] {
    // 1. Clamp inputs to the standard web-safe sRGB gamut [0.0, 1.0]
    const rClamp = Math.min(1, Math.max(0, r));
    const gClamp = Math.min(1, Math.max(0, g));
    const bClamp = Math.min(1, Math.max(0, b));

    const cMax = Math.max(rClamp, gClamp, bClamp);
    const cMin = Math.min(rClamp, gClamp, bClamp);
    const delta = cMax - cMin;

    // 2. Whiteness and Blackness calculations
    const w = cMin;
    const bl = 1 - cMax;

    // 3. Calculate Hue
    let h = 0;
    if (delta !== 0) {
        if (cMax === rClamp) {
            h = 60 * (((gClamp - bClamp) / delta) % 6);
        } else if (cMax === gClamp) {
            h = 60 * ((bClamp - rClamp) / delta + 2);
        } else if (cMax === bClamp) {
            h = 60 * ((rClamp - gClamp) / delta + 4);
        }

        if (h < 0) {
            h += 360;
        }
    }

    const result: number[] = [h, w * 100, bl * 100];

    if (a != null) {
        result.push(a);
    }

    return result;
}

export function hslvalues2hwbvalues(h: number, s: number, l: number, a: number | null = null): number[] {
    const sNorm = s / 100;
    const lNorm = l / 100;

    // Keep Hue cleanly bound to standard circle loops
    const hue = ((h % 360) + 360) % 360;

    // 1. Compute the intermediate HSV Value component (brightness peak)
    const v = lNorm + sNorm * Math.min(lNorm, 1 - lNorm);

    // 2. Compute Chroma
    const chroma = 2 * (v - lNorm);

    // 3. Extract Whiteness and Blackness
    const w = v - chroma;
    const b = 1 - v;

    const hwb = [hue, w * 100, b * 100];

    if (a != null && a !== 1) {
        hwb.push(a);
    }

    return hwb;
}
