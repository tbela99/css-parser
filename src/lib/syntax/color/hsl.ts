import type { Token } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { color2srgbvalues, getNumber } from "./color.ts";
import { cmyk2rgbvalues, lab2rgbvalues, lch2rgbvalues } from "./rgb.ts";
import { getColorComponents } from "./utils/components.ts";
import { hex2srgbvalues, oklab2srgbvalues, oklch2srgbvalues } from "./srgb.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import { hwbvalues } from "./hwb.ts";

export function hex2HslToken(arena: AstArena, token: Token): Token | null {
    let values = hex2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hslToken(arena, srgb2hslvalues(values[0], values[1], values[2], values[3]));
}

export function rgb2HslToken(arena: AstArena, token: Token): Token | null {
    const values = rgb2hslvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hslToken(arena, values);
}

export function hwb2HslToken(arena: AstArena, token: Token): Token | null {
    const values = hwb2hslvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hslToken(arena, values);
}

export function cmyk2HslToken(arena: AstArena, token: Token): Token | null {
    const values = cmyk2hslvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hslToken(arena, values);
}

export function oklab2HslToken(arena: AstArena, token: Token): Token | null {
    const values = oklab2hslvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hslToken(arena, values);
}

export function oklch2HslToken(arena: AstArena, token: Token): Token | null {
    const values = oklch2hslvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hslToken(arena, values);
}

export function lab2HslToken(arena: AstArena, token: Token): Token | null {
    const values = lab2hslvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hslToken(arena, values);
}

export function lch2HslToken(arena: AstArena, token: Token): Token | null {
    const values = lch2hslvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hslToken(arena, values);
}

export function color2HslToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = color2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return hslToken(arena, srgb2hslvalues(values[0], values[1], values[2], values[3]));
}

function hslToken(arena: AstArena, values: number[]): Token {
    if (values[1] === 0) {
        values[0] = 0;
    }

    if (values[2] === 1 || values[2] === 0) {
        values[0] = 0;
        values[1] = 0;
    }

    const chi: Token[] = <Token[]>[
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.PercentageTokenType, values[1]),
        arena.createToken(EnumToken.PercentageTokenType, values[2]),
    ];

    if (values.length === 4 && values[3] !== 1) {
        chi.push(
            arena.createToken(EnumToken.LiteralTokenType, "/"),
            arena.createToken(EnumToken.PercentageTokenType, values[3] * 100),
        );
    }

    return arena.createColor("hsl", ColorType.HSL, chi);
}

export function rgb2hslvalues(arena: AstArena, token: Token): number[] | null {
    const chi: Token[] | null = getColorComponents(arena, token);

    if (chi == null || chi.length < 3) {
        return null;
    }

    // @ts-ignore
    let t: Token = chi[0];

    // @ts-ignore
    let r: number = getNumber(arena, t);

    // @ts-ignore
    t = chi[1];
    // @ts-ignore
    let g: number = getNumber(arena, t);

    // @ts-ignore
    t = chi[2];
    // @ts-ignore
    let b: number = getNumber(arena, t);

    // @ts-ignore
    let a: number = null;

    if (chi.length === 4) {
        a = getNumber(arena, chi[3]);
    }

    const values: number[] = [r, g, b];

    if (a != null && a !== 1) {
        values.push(a);
    }

    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}

export function cmyk2hslvalues(arena: AstArena, token: Token): number[] | null {
    const values = cmyk2rgbvalues(arena, token);

    return values == null ? null : rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}

export function hwb2hslvalues(
    arena: AstArena,
    token: Token,
): [number, number, number] | [number, number, number, number] | null {
    const { h, w, b, a } = hwbvalues(arena, token) ?? {};

    if (h == null || w == null || b == null) {
        return null;
    }

    const wNorm = w / 100;
    const bNorm = b / 100;

    const hue = ((h % 360) + 360) % 360;

    if (wNorm + bNorm >= 1) {
        const grayLightness = wNorm / (wNorm + bNorm);
        return [hue, 0, grayLightness * 100];
    }

    const lightness = (1 - bNorm + wNorm) / 2;

    let saturation = 0;
    if (lightness > 0 && lightness < 1) {
        const chroma = 1 - wNorm - bNorm;
        saturation = chroma / (1 - Math.abs(2 * lightness - 1));
    }

    const hsl = [hue, saturation * 100, lightness * 100];

    if (a != null && a !== 1) {
        hsl.push(a);
    }

    return hsl as [number, number, number] | [number, number, number, number];
}

export function lab2hslvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = lab2rgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}

export function lch2hslvalues(arena: AstArena, token: Token): number[] | null {
    const values: number[] | null = lch2rgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    // @ts-ignore
    return rgbvalues2hslvalues(values[0], values[1], values[2], values[3]);
}

export function oklab2hslvalues(arena: AstArena, token: Token): number[] | null {
    const t: number[] | null = oklab2srgbvalues(arena, token);
    // @ts-ignore
    return t == null ? null : srgb2hslvalues(t[0], t[1], t[2], t[3]);
}

export function oklch2hslvalues(arena: AstArena, token: Token): number[] | null {
    const t: number[] | null = oklch2srgbvalues(arena, token);
    // @ts-ignore
    return t == null ? null : srgb2hslvalues(t[0], t[1], t[2], t[3]);
}

export function rgbvalues2hslvalues(r: number, g: number, b: number, a: number | null = null): number[] {
    return srgb2hslvalues(r / 255, g / 255, b / 255, a);
}

export function srgb2hslvalues(r: number, g: number, b: number, a: number | null = null): number[] {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    const l = (max + min) / 2;

    let h = 0;
    let s = 0;

    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));

        switch (max) {
            case r:
                h = 60 * (((g - b) / delta) % 6);
                break;
            case g:
                h = 60 * ((b - r) / delta + 2);
                break;
            case b:
                h = 60 * ((r - g) / delta + 4);
                break;
        }
    }

    h = ((h % 360) + 360) % 360;

    const hsl: number[] = [h, s * 100, l * 100];

    if (a != null && a < 1) {
        // @ts-ignore
        return hsl.concat([<number>a]);
    }

    // @ts-ignore
    return hsl;
}
