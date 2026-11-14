import type { Token } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import { color2srgbvalues, getNumber } from "./color.ts";
import { cmyk2rgbvalues, hsl2rgbvalues, hwb2rgbvalues, srgb2rgb } from "./rgb.ts";
import { getColorComponents } from "./utils/components.ts";
import { lab2srgbvalues, lch2srgbvalues, oklab2srgbvalues, oklch2srgbvalues } from "./srgb.ts";
import { COLORS_NAMES, NAMES_COLORS } from "../constants.ts";

function toHexString(acc: string, value: number): string {
    return acc + value.toString(16).padStart(2, "0");
}

export function reduceHexValue(value: string): string {
    if (value[0] !== "#") {
        value = COLORS_NAMES[value.toLowerCase()] ?? value;
    }

    const named_color: string = NAMES_COLORS[expandHexValue(value)];

    if (value.length === 7) {
        if (value[1] === value[2] && value[3] === value[4] && value[5] === value[6]) {
            value = `#${value[1]}${value[3]}${value[5]}`;
        }
    } else if (value.length === 9) {
        if (value[1] === value[2] && value[3] === value[4] && value[5] === value[6] && value[7] === value[8]) {
            value = `#${value[1]}${value[3]}${value[5]}${value[7] === "f" ? "" : value[7]}`;
        }

        if (value.endsWith("ff")) {
            value = value.slice(0, -2);
        }
    }

    return named_color != null && named_color.length <= value.length ? named_color : value;
}

export function expandHexValue(value: string): string {
    if (value.length === 4) {
        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }

    if (value.length === 5) {
        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${value[4]}${value[4]}`;
    }

    return value;
}

export function rgb2HexToken(arena: AstArena, token: Token): Token | null {
    let value: string | null = rgb2hexvalues(arena, token);

    if (value == null) {
        return null;
    }

    return hexToken(arena, value);
}

export function hsl2HexToken(arena: AstArena, token: Token): Token | null {
    let value: string | null = hsl2hexvalues(arena, token);

    if (value == null) {
        return null;
    }

    return hexToken(arena, value);
}

export function cmyk2HexToken(arena: AstArena, token: Token): Token | null {
    let value: string | null = cmyk2hexvalues(arena, token);

    if (value == null) {
        return null;
    }

    return hexToken(arena, value);
}

export function hwb2HexToken(arena: AstArena, token: Token): Token | null {
    let value: string | null = hwb2hexvalues(arena, token);

    if (value == null) {
        return null;
    }

    return hexToken(arena, value);
}

export function color2HexToken(arena: AstArena, token: Token): Token | null {
    let value: number[] | null = color2srgbvalues(arena, token);

    if (value == null) {
        return null;
    }

    return hexToken(
        arena,
        value.reduce(
            (acc, curr) =>
                acc +
                srgb2rgb(curr + Number.EPSILON)
                    .toString(16)
                    .padStart(2, "0"),
            "#",
        ),
    );
}

export function oklab2HexToken(arena: AstArena, token: Token): Token | null {
    let value: number[] | null = oklab2srgbvalues(arena, token);

    if (value == null) {
        return null;
    }

    return hexToken(arena, value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, "0"), "#"));
}

export function oklch2HexToken(arena: AstArena, token: Token): Token | null {
    let value: number[] | null = oklch2srgbvalues(arena, token);

    if (value == null) {
        return null;
    }

    return hexToken(arena, value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, "0"), "#"));
}

export function lab2HexToken(arena: AstArena, token: Token): Token | null {
    let value: number[] | null = lab2srgbvalues(arena, token);

    if (value == null) {
        return null;
    }

    return hexToken(arena, value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, "0"), "#"));
}

export function lch2HexToken(arena: AstArena, token: Token): Token | null {
    let value: number[] | null = lch2srgbvalues(arena, token);

    if (value == null) {
        return null;
    }

    return hexToken(arena, value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, "0"), "#"));
}

function hexToken(arena: AstArena, value: string): Token {
    value = reduceHexValue(value);

    return arena.createColor(value, value[0] === "#" ? ColorType.HEX : ColorType.LIT);
}

export function rgb2hexvalues(arena: AstArena, token: Token): string | null {
    let value: string = "#";
    let t: Token;

    const components: Token[] | null = getColorComponents(arena, token);

    if (components == null || components.length < 3) {
        return null;
    }

    for (let i = 0; i < 3; i++) {
        t = components[i];

        value += (
            arena.dataTypes[t] === EnumToken.Iden && arena.strings[arena.stringValue[t]] === "none"
                ? "0"
                : Math.round(getNumber(arena, t) * (arena.dataTypes[t] === EnumToken.PercentageTokenType ? 255 : 1))
        )
            .toString(16)
            .padStart(2, "0");
    }

    if (components.length === 4) {
        // @ts-ignore
        t = components[3];

        // @ts-ignore
        const v: number = getNumber(arena, t);

        // @ts-ignore
        if (v < 1) {
            // @ts-ignore
            value += Math.round(255 * getNumber(arena, t))
                .toString(16)
                .padStart(2, "0");
        }
    }

    return value;
}

export function hsl2hexvalues(arena: AstArena, token: Token): string | null {
    const t: number[] | null = hsl2rgbvalues(arena, token);

    if (t == null) {
        return null;
    }

    if (t.length === 4) {
        t[3] = srgb2rgb(t[3]);
    }

    return `${t.reduce(toHexString, "#")}`;
}

export function hwb2hexvalues(arena: AstArena, token: Token): string | null {
    const t: number[] | null = hwb2rgbvalues(arena, token);

    if (t == null) {
        return null;
    }

    if (t.length === 4) {
        t[3] = srgb2rgb(t[3]);
    }

    return `${t.reduce(toHexString, "#")}`;
}

export function cmyk2hexvalues(arena: AstArena, token: Token): string | null {
    const t: number[] | null = cmyk2rgbvalues(arena, token);

    if (t == null) {
        return null;
    }

    if (t.length === 4) {
        t[3] = srgb2rgb(t[3]);
    }

    return `#${t.reduce(toHexString, "")}`;
}
