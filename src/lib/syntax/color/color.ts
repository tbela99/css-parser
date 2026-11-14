import type { Token } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import {
    cmyk2RgbToken,
    color2RgbToken,
    hex2RgbToken,
    hsl2RgbToken,
    hwb2RgbToken,
    lab2RgbToken,
    lch2RgbToken,
    oklab2RgbToken,
    oklch2RgbToken,
} from "./rgb.ts";
import {
    cmyk2HslToken,
    color2HslToken,
    hex2HslToken,
    hwb2HslToken,
    lab2HslToken,
    lch2HslToken,
    oklab2HslToken,
    oklch2HslToken,
    rgb2HslToken,
} from "./hsl.ts";
import {
    cmyk2hwbToken,
    color2hwbToken,
    hsl2hwbToken,
    lab2hwbToken,
    lch2hwbToken,
    oklab2hwbToken,
    oklch2hwbToken,
    rgb2hwbToken,
} from "./hwb.ts";
import {
    cmyk2labToken,
    color2labToken,
    hex2labToken,
    hsl2labToken,
    hwb2labToken,
    lch2labToken,
    oklab2labToken,
    oklch2labToken,
    rgb2labToken,
} from "./lab.ts";
import {
    cmyk2lchToken,
    color2lchToken,
    hex2lchToken,
    hsl2lchToken,
    hwb2lchToken,
    lab2lchToken,
    oklab2lchToken,
    oklch2lchToken,
    rgb2lchToken,
} from "./lch.ts";
import {
    cmyk2oklabToken,
    color2oklabToken,
    hex2oklabToken,
    hsl2oklabToken,
    hwb2oklabToken,
    lab2oklabToken,
    lch2oklabToken,
    oklch2oklabToken,
    rgb2oklabToken,
} from "./oklab.ts";
import {
    cmyk2oklchToken,
    color2oklchToken,
    hex2oklchToken,
    hsl2oklchToken,
    hwb2oklchToken,
    lab2oklchToken,
    lch2oklchToken,
    oklab2oklchToken,
    rgb2oklchToken,
} from "./oklch.ts";
import { getColorComponents } from "./utils/components.ts";
import {
    cmyk2srgbvalues,
    hex2srgbvalues,
    hsl2srgb,
    hwb2srgbvalues,
    lab2srgbvalues,
    lch2srgbvalues,
    lsrgb2srgbvalues,
    oklab2srgbvalues,
    oklch2srgbvalues,
    rgb2srgb,
    srgb2lsrgbvalues,
    xyz2srgb,
} from "./srgb.ts";
import { prophotorgb2srgbvalues, srgb2prophotorgbvalues } from "./prophotorgb.ts";
import { rec20202srgb, srgb2rec2020values } from "./rec2020.ts";
import { srgb2xyz, srgb2xyz_d65 } from "./xyz.ts";
import { lp32srgbvalues, p32srgbvalues, srgb2lp3values, srgb2p3values } from "./p3.ts";
import { xyzd502srgb } from "./xyzd50.ts";
import { colorMix } from "./color-mix.ts";
import {
    cmyk2HexToken,
    color2HexToken,
    hsl2HexToken,
    hwb2HexToken,
    lab2HexToken,
    lch2HexToken,
    oklab2HexToken,
    oklch2HexToken,
    reduceHexValue,
    rgb2HexToken,
} from "./hex.ts";
import type { RelativeColorTypes } from "./relative-color.ts";
import { parseRelativeColorComponents } from "./relative-color.ts";
import { isIdentColor } from "../syntax.ts";
import {
    color2cmykToken,
    hsl2cmykToken,
    hwb2cmykToken,
    lab2cmykToken,
    lch2cmykToken,
    oklab2cmyk,
    oklch2cmykToken,
    rgb2cmykToken,
} from "./cmyk.ts";
import { a98rgb2srgbvalues, srgb2a98values } from "./a98rgb.ts";
import { colorFuncColorSpace } from "../constants.ts";
import { trimArray } from "../../validation/match.ts";
import { alpha } from "./alpha.ts";
import { equalsIgnoreCase } from "../../parser/utils/text.ts";

/**
 * Converts a color to another color space
 * @param arena
 * @param token
 * @param to
 *
 * ```ts
 *
 *     const token = arena.createColor('#F00', ColorType.HEX)
 *     const result = convertColor(arena, token, ColorType.LCH);
 *
 * ```
 */
export function convertColor(arena: AstArena, token: Token, to: ColorType): Token | null {
    if (
        arena.colorType[token] === ColorType.SYS ||
        arena.colorType[token] === ColorType.DPSYS ||
        (isIdentColor(arena, token) && "currentcolor" === arena.strings[arena.stringValue[token]])
    ) {
        return token;
    }

    if (arena.colorType[token] === ColorType.ALPHA) {
        const args: Token[] = arena
            .tokens(token)
            .filter(
                (token: Token) =>
                    arena.dataTypes[token] !== EnumToken.WhitespaceTokenType &&
                    arena.dataTypes[token] !== EnumToken.CommentTokenType,
            );

        if (
            args.length > 1 &&
            arena.dataTypes[args[args.length - 2]] === EnumToken.LiteralTokenType &&
            "/" === arena.strings[arena.stringValue[args[args.length - 2]]]
        ) {
            args.splice(args.length - 2, 1);
        }

        let values = trimArray(arena, args.slice(1));

        const result: Token | null = alpha(arena, values[0], values[1]);

        if (result == null) {
            return null;
        }

        token = result;
    }

    if (arena.colorType[token] === ColorType.COLOR_MIX && to !== ColorType.COLOR_MIX) {
        const children: Token[][] = arena.tokens(token).reduce(
            (acc: Token[][], t: Token) => {
                if (arena.dataTypes[t] === EnumToken.CommaTokenType) {
                    acc.push([]);
                } else if (
                    arena.dataTypes[t] !== EnumToken.WhitespaceTokenType &&
                    arena.dataTypes[t] !== EnumToken.CommentTokenType
                ) {
                    acc[acc.length - 1].push(t);
                }

                return acc;
            },
            [[]] as number[][],
        );

        const result: Token | null = colorMix(arena, ...children.flat(2));

        if (result == null) {
            return null;
        }

        token = result;
    }

    if (
        arena.strings[arena.unit[token]] === "rel" &&
        ["rgb", "hsl", "hwb", "lab", "lch", "oklab", "oklch", "color"].some((t) =>
            equalsIgnoreCase(t, arena.strings[arena.stringValue[token]]),
        )
    ) {
        const chi: Token[] | null = getColorComponents(arena, token);
        const offset: number = arena.strings[arena.stringValue[token]] === "color" ? 2 : 1;

        if (chi != null) {
            // @ts-ignore
            const color: Token = chi[1];
            const components: Record<RelativeColorTypes, Token> = parseRelativeColorComponents(
                arena,
                equalsIgnoreCase(arena.strings[arena.stringValue[token]], "color")
                    ? arena.strings[arena.stringValue[chi[offset]]]
                    : (arena.strings[arena.stringValue[token]] as string),
                color,
                chi[offset + 1],
                chi[offset + 2],
                chi[offset + 3],
                chi[offset + 4],
            ) as Record<RelativeColorTypes, Token>;

            if (components == null) {
                return null;
            }

            const name: string = arena.strings[arena.stringValue[token]];
            const tk: Token = arena.createColor(
                name,
                ColorType[name.toUpperCase().replaceAll("-", "_") as keyof typeof ColorType],
                name === "color" ? [arena.clone(chi[offset])] : [],
            );

            const seen: Set<Token> = new Set();

            for (const t of Object.values(components)) {
                // a component token may be used more than once: rgb(from #ff0 r g r)
                // inlined: arena.take(t)
                arena.appendToken(
                    tk,
                    seen.has(t) ? arena.clone(t, true) : arena.parents[t] === 0 ? t : arena.clone(t, true),
                );
                seen.add(t);
            }

            arena.copyLocation(tk, token);
            token = tk;
        }
    }

    if (arena.colorType[token] === to) {
        if (arena.colorType[token] === ColorType.HEX || arena.colorType[token] === ColorType.LIT) {
            const val: string = reduceHexValue(arena.strings[arena.stringValue[token]]);

            // inlined: arena.setStr(token, val)
            arena.stringValue[token] = arena.internString(val);
            arena.colorType[token] = val[0] === "#" ? ColorType.HEX : ColorType.LIT;
        }

        return token;
    }

    if (arena.colorType[token] === ColorType.COLOR) {
        const colorSpace: Token | null = arena.findToken(
            token,
            (arena: AstArena, t: Token) =>
                ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(arena.dataTypes[t]),
        );

        if (
            colorSpace != null &&
            arena.strings[arena.stringValue[colorSpace]] === ColorType[to].toLowerCase().replaceAll("_", "-")
        ) {
            for (const chi of arena.tokens(token)) {
                if (arena.dataTypes[chi] === EnumToken.NumberTokenType && !arena.hasFraction(chi)) {
                    arena.numericValue[chi] = getNumber(arena, chi);
                }
            }

            return token;
        }
    }

    if (to === ColorType.HSL) {
        switch (arena.colorType[token]) {
            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2HslToken(arena, token);

            case ColorType.HEX:
            case ColorType.LIT:
                return hex2HslToken(arena, token);

            case ColorType.HWB:
                return hwb2HslToken(arena, token);

            case ColorType.DEVICE_CMYK:
                return cmyk2HslToken(arena, token);

            case ColorType.OKLAB:
                return oklab2HslToken(arena, token);

            case ColorType.OKLCH:
                return oklch2HslToken(arena, token);

            case ColorType.LAB:
                return lab2HslToken(arena, token);

            case ColorType.LCH:
                return lch2HslToken(arena, token);

            case ColorType.COLOR:
                return color2HslToken(arena, token);
        }
    } else if (to === ColorType.HWB) {
        switch (arena.colorType[token]) {
            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2hwbToken(arena, token);

            case ColorType.HEX:
            case ColorType.LIT:
                return rgb2hwbToken(arena, token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2hwbToken(arena, token);

            case ColorType.OKLAB:
                return oklab2hwbToken(arena, token);

            case ColorType.OKLCH:
                return oklch2hwbToken(arena, token);

            case ColorType.LAB:
                return lab2hwbToken(arena, token);

            case ColorType.LCH:
                return lch2hwbToken(arena, token);

            case ColorType.DEVICE_CMYK:
                return cmyk2hwbToken(arena, token);

            case ColorType.COLOR:
                return color2hwbToken(arena, token);
        }
    } else if (to === ColorType.DEVICE_CMYK) {
        switch (arena.colorType[token]) {
            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2cmykToken(arena, token);

            case ColorType.HEX:
            case ColorType.LIT:
                return rgb2cmykToken(arena, token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2cmykToken(arena, token);

            case ColorType.HWB:
                return hwb2cmykToken(arena, token);

            case ColorType.OKLAB:
                return oklab2cmyk(arena, token);

            case ColorType.OKLCH:
                return oklch2cmykToken(arena, token);

            case ColorType.LAB:
                return lab2cmykToken(arena, token);

            case ColorType.LCH:
                return lch2cmykToken(arena, token);

            case ColorType.COLOR:
                return color2cmykToken(arena, token);
        }
    } else if (to === ColorType.HEX || to === ColorType.LIT) {
        switch (arena.colorType[token]) {
            case ColorType.HEX:
            case ColorType.LIT: {
                const val: string = reduceHexValue(arena.strings[arena.stringValue[token]]);

                return arena.createColor(val, val[0] === "#" ? ColorType.HEX : ColorType.LIT);
            }

            case ColorType.HSL:
                return hsl2HexToken(arena, token);

            case ColorType.HWB:
                return hwb2HexToken(arena, token);

            case ColorType.DEVICE_CMYK:
                return cmyk2HexToken(arena, token);

            case ColorType.OKLAB:
                return oklab2HexToken(arena, token);

            case ColorType.OKLCH:
                return oklch2HexToken(arena, token);

            case ColorType.LAB:
                return lab2HexToken(arena, token);

            case ColorType.LCH:
                return lch2HexToken(arena, token);

            case ColorType.COLOR:
                return color2HexToken(arena, token);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2HexToken(arena, token);
        }
    } else if (to === ColorType.RGB) {
        switch (arena.colorType[token]) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2RgbToken(arena, token);

            case ColorType.HSL:
                return hsl2RgbToken(arena, token);

            case ColorType.HWB:
                return hwb2RgbToken(arena, token);

            case ColorType.DEVICE_CMYK:
                return cmyk2RgbToken(arena, token);

            case ColorType.OKLAB:
                return oklab2RgbToken(arena, token);

            case ColorType.OKLCH:
                return oklch2RgbToken(arena, token);

            case ColorType.LAB:
                return lab2RgbToken(arena, token);

            case ColorType.LCH:
                return lch2RgbToken(arena, token);

            case ColorType.COLOR:
                return color2RgbToken(arena, token);
        }
    } else if (to === ColorType.LAB) {
        switch (arena.colorType[token]) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2labToken(arena, token);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2labToken(arena, token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2labToken(arena, token);

            case ColorType.HWB:
                return hwb2labToken(arena, token);

            case ColorType.DEVICE_CMYK:
                return cmyk2labToken(arena, token);

            case ColorType.LCH:
                return lch2labToken(arena, token);

            case ColorType.OKLAB:
                return oklab2labToken(arena, token);

            case ColorType.OKLCH:
                return oklch2labToken(arena, token);

            case ColorType.COLOR:
                return color2labToken(arena, token);
        }
    } else if (to === ColorType.LCH) {
        switch (arena.colorType[token]) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2lchToken(arena, token);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2lchToken(arena, token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2lchToken(arena, token);

            case ColorType.HWB:
                return hwb2lchToken(arena, token);

            case ColorType.DEVICE_CMYK:
                return cmyk2lchToken(arena, token);

            case ColorType.LAB:
                return lab2lchToken(arena, token);

            case ColorType.OKLAB:
                return oklab2lchToken(arena, token);

            case ColorType.OKLCH:
                return oklch2lchToken(arena, token);

            case ColorType.COLOR:
                return color2lchToken(arena, token);
        }
    } else if (to === ColorType.OKLAB) {
        switch (arena.colorType[token]) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2oklabToken(arena, token);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2oklabToken(arena, token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2oklabToken(arena, token);

            case ColorType.HWB:
                return hwb2oklabToken(arena, token);

            case ColorType.DEVICE_CMYK:
                return cmyk2oklabToken(arena, token);

            case ColorType.LAB:
                return lab2oklabToken(arena, token);

            case ColorType.LCH:
                return lch2oklabToken(arena, token);

            case ColorType.OKLCH:
                return oklch2oklabToken(arena, token);

            case ColorType.COLOR:
                return color2oklabToken(arena, token);
        }
    } else if (to === ColorType.OKLCH) {
        switch (arena.colorType[token]) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2oklchToken(arena, token);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2oklchToken(arena, token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2oklchToken(arena, token);

            case ColorType.HWB:
                return hwb2oklchToken(arena, token);

            case ColorType.DEVICE_CMYK:
                return cmyk2oklchToken(arena, token);

            case ColorType.LAB:
                return lab2oklchToken(arena, token);

            case ColorType.OKLAB:
                return oklab2oklchToken(arena, token);

            case ColorType.LCH:
                return lch2oklchToken(arena, token);

            case ColorType.COLOR:
                return color2oklchToken(arena, token);
        }
    } else if (
        colorFuncColorSpace.includes(
            (ColorType[to].toLowerCase().replaceAll("_", "-") as string).toLowerCase().replaceAll("_", "-"),
        )
    ) {
        switch (arena.colorType[token]) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2colorToken(arena, token, to);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2colorToken(arena, token, to);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2colorToken(arena, token, to);

            case ColorType.HWB:
                return hwb2colorToken(arena, token, to);

            case ColorType.DEVICE_CMYK:
                return cmyk2colorToken(arena, token, to);

            case ColorType.LAB:
                return lab2colorToken(arena, token, to);
            case ColorType.OKLAB:
                return oklab2colorToken(arena, token, to);

            case ColorType.LCH:
                return lch2colorToken(arena, token, to);

            case ColorType.OKLCH:
                return oklch2colorToken(arena, token, to);

            case ColorType.COLOR:
                return color2colorToken(arena, token, to);
        }
    }

    return null;
}

export function hex2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null {
    const values: number[] = hex2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return values2colortoken(arena, values, to);
}

export function rgb2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null {
    const values: number[] | null = rgb2srgb(arena, token);

    if (values == null) {
        return null;
    }

    return values2colortoken(arena, values, to);
}

export function hsl2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null {
    const values: number[] | null = hsl2srgb(arena, token);

    if (values == null) {
        return null;
    }

    return values2colortoken(arena, values, to);
}

export function hwb2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null {
    const values: number[] | null = hwb2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return values2colortoken(arena, values, to);
}

export function cmyk2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null {
    const values: number[] | null = cmyk2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return values2colortoken(arena, values, to);
}

export function lab2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null {
    const values: number[] | null = lab2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return values2colortoken(arena, values, to);
}

export function oklab2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null {
    const values: number[] | null = oklab2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return values2colortoken(arena, values, to);
}

export function lch2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null {
    const values: number[] | null = lch2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return values2colortoken(arena, values, to);
}

export function oklch2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null {
    const values: number[] | null = oklch2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return values2colortoken(arena, values, to);
}

export function color2colorToken(arena: AstArena, token: Token, to: ColorType): Token | null {
    const values: number[] | null = color2srgbvalues(arena, token);

    if (values == null) {
        return null;
    }

    return values2colortoken(arena, values, to);
}

function srgb2srgbcolorspace(val: number[], to: ColorType): number[] | null {
    switch (to) {
        case ColorType.SRGB:
            return val;

        case ColorType.SRGB_LINEAR:
            return srgb2lsrgbvalues(val[0], val[1], val[2], val[3]);

        case ColorType.DISPLAY_P3:
            return srgb2p3values(val[0], val[1], val[2], val[3]);

        case ColorType.DISPLAY_P3_LINEAR:
            return srgb2lp3values(val[0], val[1], val[2], val[3]);

        case ColorType.PROPHOTO_RGB:
            return srgb2prophotorgbvalues(val[0], val[1], val[2], val[3]);

        case ColorType.A98_RGB:
            return srgb2a98values(val[0], val[1], val[2], val[3]);

        case ColorType.REC2020:
            return srgb2rec2020values(val[0], val[1], val[2], val[3]);

        case ColorType.XYZ:
        case ColorType.XYZ_D65:
            return srgb2xyz(val[0], val[1], val[2], val[3]);

        case ColorType.XYZ_D50:
            return srgb2xyz_d65(val[0], val[1], val[2], val[3]);
    }

    return null;
}

export function minmax(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
}

export function color2srgbvalues(arena: AstArena, token: Token): number[] | null {
    const components: Token[] = getColorComponents(arena, token) as number[];

    if (components == null) {
        return null;
    }

    const colorSpace: Token = components.shift() as Token;
    let values: number[] = components.map((val: Token) => getNumber(arena, val));

    switch (arena.strings[arena.stringValue[colorSpace]]) {
        case "display-p3":
            values = p32srgbvalues(values[0], values[1], values[2], values[3]);
            break;
        case "display-p3-linear":
            values = lp32srgbvalues(values[0], values[1], values[2], values[3]);
            break;
        case "srgb-linear":
            values = lsrgb2srgbvalues(values[0], values[1], values[2], values[3]);
            break;
        case "prophoto-rgb":
            values = prophotorgb2srgbvalues(values[0], values[1], values[2], values[3]);
            break;
        case "a98-rgb":
            values = a98rgb2srgbvalues(values[0], values[1], values[2], values[3]);
            break;
        case "rec2020":
            values = rec20202srgb(values[0], values[1], values[2], values[3]);
            break;
        case "xyz":
        case "xyz-d65":
            values = xyz2srgb(values[0], values[1], values[2], values[3]);
            break;
        case "xyz-d50":
            values = xyzd502srgb(values[0], values[1], values[2], values[3]);
            break;
    }

    if (values.length === 4) {
        values[3] = values[3];
    }

    return values;
}

function values2colortoken(arena: AstArena, values: number[], to: ColorType): Token | null {
    // @ts-expect-error
    values = srgb2srgbcolorspace(values, to);

    if (values == null) {
        return null;
    }

    const chi: Token[] = [
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.NumberTokenType, values[1]),
        arena.createToken(EnumToken.NumberTokenType, values[2]),
    ] as number[];

    if (values.length === 4) {
        chi.push(
            arena.createToken(EnumToken.LiteralTokenType, "/"),
            arena.createToken(EnumToken.PercentageTokenType, values[3] * 100),
        );
    }

    const colorSpace: string = ColorType[to].toLowerCase().replaceAll("_", "-");

    return colorFuncColorSpace.includes(colorSpace)
        ? arena.createColor(
              "color",
              ColorType.COLOR,
              [arena.createToken(EnumToken.IdenTokenType, colorSpace)].concat(chi),
          )
        : arena.createColor(colorSpace, to, chi);
}

/**
 * clamp color values
 * @param arena
 * @param token
 */
export function clamp(arena: AstArena, token: Token): Token {
    if (arena.colorType[token] === ColorType.RGB) {
        let index: number = 0;

        for (let t = arena.firstToken[token]; t !== 0; t = arena.nextSibling[t]) {
            const typ: EnumToken = arena.dataTypes[t];

            if (
                typ === EnumToken.LiteralTokenType ||
                typ === EnumToken.CommaTokenType ||
                typ === EnumToken.WhitespaceTokenType
            ) {
                continue;
            }

            if (index <= 2) {
                if (typ === EnumToken.NumberTokenType) {
                    arena.numericValue[t] = minmax(arena.numericValue[t], 0, 255);
                } else if (typ === EnumToken.PercentageTokenType) {
                    arena.numericValue[t] = minmax(arena.numericValue[t], 0, 100);
                }
            } else {
                if (typ === EnumToken.NumberTokenType) {
                    arena.numericValue[t] = minmax(arena.numericValue[t], 0, 1);
                } else if (typ === EnumToken.PercentageTokenType) {
                    arena.numericValue[t] = minmax(arena.numericValue[t], 0, 100);
                }
            }

            index++;
        }
    }

    return token;
}

/**
 * numeric value of a number, percentage, fraction or `none` token. percentages are divided by 100
 * @param arena
 * @param token
 */
export function getNumber(arena: AstArena, token: Token): number {
    const typ: EnumToken = arena.dataTypes[token];

    if (typ === EnumToken.IdenTokenType && arena.strings[arena.stringValue[token]] === "none") {
        return 0;
    }

    let val: number;
    const fraction: Token = arena.getFraction(token);

    if (fraction !== 0) {
        val = arena.numericValue[arena.firstChild[fraction]] / arena.numericValue[arena.lastChild[fraction]];
    } else {
        val = arena.numericValue[token];
    }

    return typ === EnumToken.PercentageTokenType ? val / 100 : val;
}

/**
 * convert angle to turn
 * @param arena
 * @param token
 */
export function getAngle(arena: AstArena, token: Token): number {
    const typ: EnumToken = arena.dataTypes[token];

    if (typ === EnumToken.IdenTokenType) {
        if (arena.strings[arena.stringValue[token]] === "none") {
            return 0;
        }
    }

    const val: number = getNumber(arena, token);

    if (typ === EnumToken.AngleTokenType) {
        switch (arena.strings[arena.unit[token]]) {
            case "deg":
                return val / 360;

            case "rad":
                return val / (2 * Math.PI);

            case "grad":
                return val / 400;

            case "turn":
                return val;
        }
    }

    return val / 360;
}
