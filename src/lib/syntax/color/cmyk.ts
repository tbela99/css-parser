import type { Token } from "../../../@types/token.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import { color2srgbvalues } from "./color.ts";
import {
    hwb2srgbvalues,
    lab2srgbvalues,
    lch2srgbvalues,
    oklab2srgbvalues,
    oklch2srgbvalues,
    rgb2srgbvalues,
} from "./srgb.ts";
import { hsl2srgbvalues } from "./rgb.ts";

/**
 *
 * @param arena
 * @param token
 */
export function rgb2cmykToken(arena: AstArena, token: Token): Token | null {
    let components: number[] | null = rgb2srgbvalues(arena, token);

    if (components == null || components.length < 3) {
        return null;
    }

    return cmyktoken(arena, srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}

export function hsl2cmykToken(arena: AstArena, token: Token): Token | null {
    let values: number[] | null = hsl2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return cmyktoken(arena, srgb2cmykvalues(values[0], values[1], values[2], values[3]));
}

export function hwb2cmykToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hwb2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return cmyktoken(arena, srgb2cmykvalues(values[0], values[1], values[2], values[3]));
}

export function lab2cmykToken(arena: AstArena, token: Token): Token | null {
    const components: number[] | null = lab2srgbvalues(arena, token);

    if (components == null || components.length < 3) {
        return null;
    }

    return cmyktoken(arena, srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}

export function lch2cmykToken(arena: AstArena, token: Token): Token | null {
    const components: number[] | null = lch2srgbvalues(arena, token);

    if (components == null || components.length < 3) {
        return null;
    }

    return cmyktoken(arena, srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}

export function oklab2cmyk(arena: AstArena, token: Token): Token | null {
    const components: number[] | null = oklab2srgbvalues(arena, token);

    if (components == null || components.length < 3) {
        return null;
    }

    return cmyktoken(arena, srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}

export function oklch2cmykToken(arena: AstArena, token: Token): Token | null {
    const components: number[] | null = oklch2srgbvalues(arena, token);

    if (components == null || components.length < 3) {
        return null;
    }

    return cmyktoken(arena, srgb2cmykvalues(components[0], components[1], components[2], components[3]));
}

export function color2cmykToken(arena: AstArena, token: Token): Token | null {
    const values = color2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return cmyktoken(arena, srgb2cmykvalues(values[0], values[1], values[2], values[3]));
}

export function srgb2cmykvalues(r: number, g: number, b: number, a: number | null = null): number[] {
    const k: number = 1 - Math.max(r, g, b);
    const div: number = 1 - k;
    const c: number = k == 1 ? 0 : (1 - r - k) / div;
    const m: number = k == 1 ? 0 : (1 - g - k) / div;
    const y: number = k == 1 ? 0 : (1 - b - k) / div;

    const result: number[] = [c, m, y, k];
    if (a != null && a < 1) {
        result.push(a);
    }

    return result;
}

function cmyktoken(arena: AstArena, values: number[]): Token {
    const chi: Token[] = [];

    for (let index = 0; index < values.length; index++) {
        if (index == 4) {
            chi.push(arena.createToken(EnumToken.LiteralTokenType, "/"));
        }

        chi.push(arena.createToken(EnumToken.PercentageTokenType, values[index] * 100));
    }

    return arena.createColor("device-cmyk", ColorType.DEVICE_CMYK, chi);
}
