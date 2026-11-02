import type { Token } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { color2srgbvalues, minmax } from "./color.ts";
import { expandHexValue } from "./hex.ts";
import {
    cmyk2srgbvalues,
    hslvalues,
    hslvalues2srgbvalues,
    hwb2srgbvalues,
    lab2srgbvalues,
    lch2srgbvalues,
    oklab2srgbvalues,
    oklch2srgbvalues,
} from "./srgb.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import { COLORS_NAMES } from "../constants.ts";

export function srgb2rgb(value: number): number {
    return minmax(Math.round(value * 255), 0, 255);
}

export function hex2RgbToken(arena: AstArena, token: Token): Token | null {
    return rgb2RgbToken(arena, hex2rgbvalues(arena, token));
}

export function hsl2RgbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hsl2rgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(arena, values);
}

export function hwb2RgbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = hwb2rgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(arena, values);
}

export function cmyk2RgbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = cmyk2rgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(arena, values);
}

export function oklab2RgbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = oklab2rgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(arena, values);
}

export function oklch2RgbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = oklch2rgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(arena, values);
}

export function lab2RgbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = lab2rgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(arena, values);
}

export function lch2RgbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = lch2rgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(arena, values);
}

export function color2RgbToken(arena: AstArena, token: Token): Token | null {
    const values: number[] | null = color2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return rgb2RgbToken(arena, values.map((t: number, index: number) => (index == 3 ? t : srgb2rgb(t))));
}

function rgb2RgbToken(arena: AstArena, values: number[]): Token | null {
    const chi: Token[] = <Token[]>[
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.NumberTokenType, values[1]),
        arena.createToken(EnumToken.NumberTokenType, values[2]),
    ];

    if (values.length == 4) {
        chi.push(arena.createToken(EnumToken.PercentageTokenType, values[3] * 100));
    }

    return arena.createColor("rgb", ColorType.RGB, chi);
}
export function hex2rgbvalues(arena: AstArena, token: Token): number[] {
    const value: string = expandHexValue(
        arena.colorType[token] == ColorType.LIT
            ? COLORS_NAMES[arena.strings[arena.stringValue[token]].toLowerCase()]
            : arena.strings[arena.stringValue[token]],
    );
    const rgb: number[] = [];

    for (let i = 1; i < value.length; i += 2) {
        rgb.push(parseInt(value.slice(i, i + 2), 16));
    }

    if (rgb.length == 4) {
        if (rgb[3] == 255) {
            rgb.pop();
        } else {
            rgb[3] = +(rgb[3] / 255).toFixed(2);
        }
    }

    return rgb;
}

export function hwb2rgbvalues(arena: AstArena, token: Token): number[] | null {
    return hwb2srgbvalues(arena, token)?.map?.((t: number, index: number) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}

export function hsl2rgbvalues(arena: AstArena, token: Token): number[] | null {

    let { h, s, l, a } = hslvalues(arena, token) ?? {};

    if (h == null || s == null || l == null) {
        return null;
    }

    return hslvalues2srgbvalues(h , s, l)
        .map((t: number) => minmax(Math.round(t * 255), 0, 255))
        .concat(a == 1 || a == null ? [] : [a]);
}

export function hsl2srgbvalues(arena: AstArena, token: Token): number[] | null {
    let { h, s, l, a } = hslvalues(arena, token) ?? {};

    if (h == null || s == null || l == null) {
        return null;
    }

    return hslvalues2srgbvalues(h, s, l).concat(a == 1 || a == null ? [] : [a]);
}

export function cmyk2rgbvalues(arena: AstArena, token: Token): number[] | null {
    return cmyk2srgbvalues(arena, token)?.map?.((t: number, index: number) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}

export function oklab2rgbvalues(arena: AstArena, token: Token): number[] | null {
    return oklab2srgbvalues(arena, token)?.map?.((t: number, index: number) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}

export function oklch2rgbvalues(arena: AstArena, token: Token): number[] | null {
    return oklch2srgbvalues(arena, token)?.map?.((t: number, index: number) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}

export function lab2rgbvalues(arena: AstArena, token: Token): number[] | null {
    return lab2srgbvalues(arena, token)?.map?.((t: number, index: number) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}

export function lch2rgbvalues(arena: AstArena, token: Token): number[] | null {
    return lch2srgbvalues(arena, token)?.map?.((t: number, index: number) => (index == 3 ? t : srgb2rgb(t))) ?? null;
}
