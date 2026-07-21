import type {
    AngleToken,
    ColorToken,
    FractionToken,
    IdentToken,
    LiteralToken,
    NumberToken,
    PercentageToken,
    Token,
} from "../../../@types/index.d.ts";
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
import { epsilon, LOC } from "../constants.ts";
import { colorFuncColorSpace, colorPrecision, anglePrecision } from "../constants.ts";
import { trimArray } from "../../validation/match.ts";
import { alpha } from "./alpha.ts";
import { equalsIgnoreCase } from "../../parser/utils/text.ts";

/**
 * Converts a color to another color space
 * @param token
 * @param to
 *
 * ```ts
 *
 *     const token = {typ: EnumToken.ColorTokenType, kin: ColorType.HEX, val: '#F00'}
 *     const result = convertColor(token, ColorType.LCH);
 *
 * ```
 */
export function convertColor(token: ColorToken, to: ColorType): ColorToken | null {
    if (
        token.kin == ColorType.SYS ||
        token.kin == ColorType.DPSYS ||
        (isIdentColor(token) && "currentcolor" == token.val)
    ) {
        return token;
    }

    if (token.kin == ColorType.ALPHA) {
        const args: Token[] = ((token as ColorToken).chi as Token[]).filter(
            (token: Token) => token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType,
        );

        if (args.at(-2)?.typ === EnumToken.LiteralTokenType && "/" === (args.at(-2) as LiteralToken)?.val) {
            args.splice(args.length - 2, 1);
        }

        // @ts-expect-error
        token = alpha(...trimArray(args.slice(1)));

        if (token == null) {
            return null;
        }
    }

    if (token.kin == ColorType.COLOR_MIX && to != ColorType.COLOR_MIX) {
        const children: Token[][] = ((token as ColorToken).chi as Token[]).reduce(
            (acc: Token[][], t: Token) => {
                if (t.typ === EnumToken.CommaTokenType) {
                    acc.push([]);
                } else if (t.typ !== EnumToken.WhitespaceTokenType && t.typ !== EnumToken.CommentTokenType) {
                    acc[acc.length - 1].push(t);
                }

                return acc;
            },
            [[]] as Token[][],
        );

        token = colorMix(...children.flat(2)) as ColorToken;

        if (token == null) {
            return null;
        }
    }

    if (
        (token as ColorToken).cal == "rel" &&
        ["rgb", "hsl", "hwb", "lab", "lch", "oklab", "oklch", "color"].some((t) =>
            equalsIgnoreCase(t, (token as ColorToken).val),
        )
    ) {
        const chi: Token[] | null = getColorComponents(token as ColorToken);
        const offset: number = (token as ColorToken).val == "color" ? 2 : 1;

        if (chi != null) {
            // @ts-ignore
            const color: ColorToken = chi[1];
            const components: Record<RelativeColorTypes, Token> = parseRelativeColorComponents(
                equalsIgnoreCase((token as ColorToken).val, "color")
                    ? (chi[offset] as IdentToken).val
                    : ((token as ColorToken).val as string),
                color,
                chi[offset + 1],
                chi[offset + 2],
                chi[offset + 3],
                chi[offset + 4],
            ) as Record<RelativeColorTypes, Token>;

            if (components == null) {
                return null;
            }

            let { cal, ...tk } = {
                ...token,
                chi: [...((token as ColorToken).val == "color" ? [chi[offset]] : []), ...Object.values(components)],
                kin: ColorType[token.val.toUpperCase().replaceAll("-", "_") as keyof typeof ColorType],
            };

            tk[LOC] = token[LOC];
            token = tk as ColorToken;
        }
    }

    if (token.kin == to) {
        if (token.kin == ColorType.HEX || token.kin == ColorType.LIT) {
            token.val = reduceHexValue(token.val);
            token.kin = token.val[0] == "#" ? ColorType.HEX : ColorType.LIT;
        }

        return token;
    }

    if (token.kin == ColorType.COLOR) {
        const colorSpace: IdentToken = (token.chi as Token[]).find(
            (t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ),
        ) as IdentToken;

        if (colorSpace.val == ColorType[to].toLowerCase().replaceAll("_", "-")) {
            for (const chi of (token as ColorToken).chi as Token[]) {
                if (chi.typ == EnumToken.NumberTokenType && typeof (chi as NumberToken).val == "number") {
                    (chi as NumberToken).val = toPrecisionValue(getNumber(chi as NumberToken)) as number;
                }
            }

            return token;
        }
    }

    if (to == ColorType.HSL) {
        switch (token.kin) {
            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2HslToken(token);

            case ColorType.HEX:
            case ColorType.LIT:
                return hex2HslToken(token);

            case ColorType.HWB:
                return hwb2HslToken(token);

            case ColorType.DEVICE_CMYK:
                return cmyk2HslToken(token);

            case ColorType.OKLAB:
                return oklab2HslToken(token);

            case ColorType.OKLCH:
                return oklch2HslToken(token);

            case ColorType.LAB:
                return lab2HslToken(token);

            case ColorType.LCH:
                return lch2HslToken(token);

            case ColorType.COLOR:
                return color2HslToken(token);
        }
    } else if (to == ColorType.HWB) {
        switch (token.kin) {
            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2hwbToken(token);

            case ColorType.HEX:
            case ColorType.LIT:
                return rgb2hwbToken(token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2hwbToken(token);

            case ColorType.OKLAB:
                return oklab2hwbToken(token);

            case ColorType.OKLCH:
                return oklch2hwbToken(token);

            case ColorType.LAB:
                return lab2hwbToken(token);

            case ColorType.LCH:
                return lch2hwbToken(token);

            case ColorType.DEVICE_CMYK:
                return cmyk2hwbToken(token);

            case ColorType.COLOR:
                return color2hwbToken(token);
        }
    } else if (to == ColorType.DEVICE_CMYK) {
        switch (token.kin) {
            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2cmykToken(token);

            case ColorType.HEX:
            case ColorType.LIT:
                return rgb2cmykToken(token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2cmykToken(token);

            case ColorType.HWB:
                return hwb2cmykToken(token);

            case ColorType.OKLAB:
                return oklab2cmyk(token);

            case ColorType.OKLCH:
                return oklch2cmykToken(token);

            case ColorType.LAB:
                return lab2cmykToken(token);

            case ColorType.LCH:
                return lch2cmykToken(token);

            case ColorType.COLOR:
                return color2cmykToken(token);
        }
    } else if (to == ColorType.HEX || to == ColorType.LIT) {
        switch (token.kin) {
            case ColorType.HEX:
            case ColorType.LIT: {
                const val: string = reduceHexValue(token.val);

                return {
                    typ: EnumToken.ColorTokenType,
                    val: val,
                    kin: val[0] == "#" ? ColorType.HEX : ColorType.LIT,
                };
            }

            case ColorType.HSL:
                return hsl2HexToken(token);

            case ColorType.HWB:
                return hwb2HexToken(token);

            case ColorType.DEVICE_CMYK:
                return cmyk2HexToken(token);

            case ColorType.OKLAB:
                return oklab2HexToken(token);

            case ColorType.OKLCH:
                return oklch2HexToken(token);

            case ColorType.LAB:
                return lab2HexToken(token);

            case ColorType.LCH:
                return lch2HexToken(token);

            case ColorType.COLOR:
                return color2HexToken(token);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2HexToken(token);
        }
    } else if (to == ColorType.RGB) {
        switch (token.kin) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2RgbToken(token);

            case ColorType.HSL:
                return hsl2RgbToken(token);

            case ColorType.HWB:
                return hwb2RgbToken(token);

            case ColorType.DEVICE_CMYK:
                return cmyk2RgbToken(token);

            case ColorType.OKLAB:
                return oklab2RgbToken(token);

            case ColorType.OKLCH:
                return oklch2RgbToken(token);

            case ColorType.LAB:
                return lab2RgbToken(token);

            case ColorType.LCH:
                return lch2RgbToken(token);

            case ColorType.COLOR:
                return color2RgbToken(token);
        }
    } else if (to == ColorType.LAB) {
        switch (token.kin) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2labToken(token);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2labToken(token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2labToken(token);

            case ColorType.HWB:
                return hwb2labToken(token);

            case ColorType.DEVICE_CMYK:
                return cmyk2labToken(token);

            case ColorType.LCH:
                return lch2labToken(token);

            case ColorType.OKLAB:
                return oklab2labToken(token);

            case ColorType.OKLCH:
                return oklch2labToken(token);

            case ColorType.COLOR:
                return color2labToken(token);
        }
    } else if (to == ColorType.LCH) {
        switch (token.kin) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2lchToken(token);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2lchToken(token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2lchToken(token);

            case ColorType.HWB:
                return hwb2lchToken(token);

            case ColorType.DEVICE_CMYK:
                return cmyk2lchToken(token);

            case ColorType.LAB:
                return lab2lchToken(token);

            case ColorType.OKLAB:
                return oklab2lchToken(token);

            case ColorType.OKLCH:
                return oklch2lchToken(token);

            case ColorType.COLOR:
                return color2lchToken(token);
        }
    } else if (to == ColorType.OKLAB) {
        switch (token.kin) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2oklabToken(token);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2oklabToken(token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2oklabToken(token);

            case ColorType.HWB:
                return hwb2oklabToken(token);

            case ColorType.DEVICE_CMYK:
                return cmyk2oklabToken(token);

            case ColorType.LAB:
                return lab2oklabToken(token);

            case ColorType.LCH:
                return lch2oklabToken(token);

            case ColorType.OKLCH:
                return oklch2oklabToken(token);

            case ColorType.COLOR:
                return color2oklabToken(token);
        }
    } else if (to == ColorType.OKLCH) {
        switch (token.kin) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2oklchToken(token);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2oklchToken(token);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2oklchToken(token);

            case ColorType.HWB:
                return hwb2oklchToken(token);

            case ColorType.DEVICE_CMYK:
                return cmyk2oklchToken(token);

            case ColorType.LAB:
                return lab2oklchToken(token);

            case ColorType.OKLAB:
                return oklab2oklchToken(token);

            case ColorType.LCH:
                return lch2oklchToken(token);

            case ColorType.COLOR:
                return color2oklchToken(token);
        }
    } else if (
        colorFuncColorSpace.includes(
            (ColorType[to].toLowerCase().replaceAll("_", "-") as string).toLowerCase().replaceAll("_", "-"),
        )
    ) {
        
        switch (token.kin) {
            case ColorType.HEX:
            case ColorType.LIT:
                return hex2colorToken(token, to);

            case ColorType.RGB:
            case ColorType.RGBA:
                return rgb2colorToken(token, to);

            case ColorType.HSL:
            case ColorType.HSLA:
                return hsl2colorToken(token, to);

            case ColorType.HWB:
                return hwb2colorToken(token, to);

            case ColorType.DEVICE_CMYK:
                return cmyk2colorToken(token, to);

            case ColorType.LAB:
                return lab2colorToken(token, to);
            case ColorType.OKLAB:
                return oklab2colorToken(token, to);

            case ColorType.LCH:
                return lch2colorToken(token, to);

            case ColorType.OKLCH:
                return oklch2colorToken(token, to);

            case ColorType.COLOR:
                return color2colorToken(token, to);
        }
    }

    return null;
}

export function hex2colorToken(token: ColorToken, to: ColorType): ColorToken | null {
    const values: number[] = hex2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function rgb2colorToken(token: ColorToken, to: ColorType): ColorToken | null {
    const values: number[] | null = rgb2srgb(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function hsl2colorToken(token: ColorToken, to: ColorType): ColorToken | null {
    const values: number[] | null = hsl2srgb(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function hwb2colorToken(token: ColorToken, to: ColorType): ColorToken | null {
    const values: number[] | null = hwb2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function cmyk2colorToken(token: ColorToken, to: ColorType): ColorToken | null {
    const values: number[] | null = cmyk2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function lab2colorToken(token: ColorToken, to: ColorType): ColorToken | null {
    const values: number[] | null = lab2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function oklab2colorToken(token: ColorToken, to: ColorType): ColorToken | null {
    const values: number[] | null = oklab2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function lch2colorToken(token: ColorToken, to: ColorType): ColorToken | null {
    const values: number[] | null = lch2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function oklch2colorToken(token: ColorToken, to: ColorType): ColorToken | null {
    const values: number[] | null = oklch2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function color2colorToken(token: ColorToken, to: ColorType): ColorToken | null {
    const values: number[] | null = color2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

function srgb2srgbcolorspace(val: number[], to: ColorType): number[] {
    const values: number[] = [];

    switch (to) {
        case ColorType.SRGB:
            values.push(...val);
            break;
        case ColorType.SRGB_LINEAR:
            // @ts-ignore
            values.push(...srgb2lsrgbvalues(...val));
            break;
        case ColorType.DISPLAY_P3:
            // @ts-ignore
            values.push(...srgb2p3values(...val));
            break;
        case ColorType.DISPLAY_P3_LINEAR:
            // @ts-ignore
            values.push(...srgb2lp3values(...val));
            break;
        case ColorType.PROPHOTO_RGB:
            // @ts-ignore
            values.push(...srgb2prophotorgbvalues(...val));
            break;
        case ColorType.A98_RGB:
            // @ts-ignore
            values.push(...srgb2a98values(...val));
            break;

        case ColorType.REC2020:
            // @ts-ignore
            values.push(...srgb2rec2020values(...val));
            break;

        case ColorType.XYZ:
        case ColorType.XYZ_D65:
            // @ts-ignore
            values.push(...srgb2xyz(...val));
            break;

        case ColorType.XYZ_D50:
            // @ts-ignore
            values.push(...srgb2xyz_d65(...val));
            break;
    }

    return values;
}

export function minmax(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
}

export function color2srgbvalues(token: ColorToken): number[] | null {
    const components: Token[] = getColorComponents(token) as Token[];

    if (components == null) {
        return null;
    }

    const colorSpace: IdentToken = components.shift() as IdentToken;
    let values: number[] = components.map((val: Token) =>
        getNumber(val as IdentToken | NumberToken | PercentageToken | FractionToken),
    );

    switch (colorSpace.val) {
        case "display-p3":
            // @ts-ignore
            values = p32srgbvalues(...values);
            break;
        case "display-p3-linear":
            // @ts-ignore
            values = lp32srgbvalues(...values);
            break;
        case "srgb-linear":
            // @ts-ignore
            values = lsrgb2srgbvalues(...values);
            break;
        case "prophoto-rgb":
            // @ts-ignore
            values = prophotorgb2srgbvalues(...values);
            break;
        case "a98-rgb":
            // @ts-ignore
            values = a98rgb2srgbvalues(...values);
            break;
        case "rec2020":
            // @ts-ignore
            values = rec20202srgb(...values);
            break;
        case "xyz":
        case "xyz-d65":
            // @ts-ignore
            values = xyz2srgb(...values);
            break;
        case "xyz-d50":
            // @ts-ignore
            values = xyzd502srgb(...values);
            break;
    }

    if (values.length == 4) {
        values[3] = toPrecisionValue(values[3], 2);
    }

    return values;
}

function values2colortoken(values: number[], to: ColorType): ColorToken {
    
    values = srgb2srgbcolorspace(values, to);

    const chi: Token[] = [
        { typ: EnumToken.NumberTokenType, val: toPrecisionValue(values[0]) },
        { typ: EnumToken.NumberTokenType, val: toPrecisionValue(values[1]) },
        { typ: EnumToken.NumberTokenType, val: toPrecisionValue(values[2]) },
    ] as Token[];

    if (values.length == 4) {
        chi.push(
            { typ: EnumToken.LiteralTokenType, val: "/" },
            {
                typ: EnumToken.PercentageTokenType,
                val: toPrecisionValue(values[3], 2) * 100,
            },
        );
    }

    const colorSpace: string = ColorType[to].toLowerCase().replaceAll("_", "-");

    return colorFuncColorSpace.includes(colorSpace)
        ? ({
              typ: EnumToken.ColorTokenType,
              val: "color",
              chi: [{ typ: EnumToken.IdenTokenType, val: colorSpace } as Token].concat(chi),
              kin: ColorType.COLOR,
          } as ColorToken)
        : ({
              typ: EnumToken.ColorTokenType,
              val: colorSpace,
              chi,
              kin: to,
          } as ColorToken);
}

/**
 * clamp color values
 * @param token
 */
export function clamp(token: ColorToken): ColorToken {
    if (token.kin == ColorType.RGB) {
        (token.chi as Token[])
            .filter(
                (token: Token) =>
                    ![EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(
                        token.typ,
                    ),
            )
            .forEach((token: Token, index: number) => {
                if (index <= 2) {
                    if (token.typ == EnumToken.NumberTokenType) {
                        (token as NumberToken).val = minmax(+(token as NumberToken).val, 0, 255);
                    } else if (token.typ == EnumToken.PercentageTokenType) {
                        (token as PercentageToken).val = minmax(+(token as PercentageToken).val, 0, 100);
                    }
                } else {
                    if (token.typ == EnumToken.NumberTokenType) {
                        (token as NumberToken).val = minmax(+(token as NumberToken).val, 0, 1);
                    } else if (token.typ == EnumToken.PercentageTokenType) {
                        (token as PercentageToken).val = minmax(+(token as PercentageToken).val, 0, 100);
                    }
                }
            });
    }

    return token;
}

export function getNumber(token: NumberToken | PercentageToken | IdentToken | FractionToken): number {
    if (token.typ == EnumToken.IdenTokenType && token.val == "none") {
        return 0;
    }

    let val: number;

    // @ts-ignore
    if (typeof token.val != "number" && (token.val as FractionToken)?.typ == EnumToken.FractionTokenType) {
        val = ((((token as NumberToken | PercentageToken).val as FractionToken).l.val as number) /
            // @ts-expect-error
            ((token as NumberToken | PercentageToken).val as FractionToken).r.val) as number;
    } else {
        val = (token as PercentageToken | NumberToken).val as number;
    }

    // @ts-ignore
    return (token as PercentageToken | NumberToken).typ == EnumToken.PercentageTokenType ? val / 100 : val;
}

/**
 * convert angle to turn
 * @param token
 */
export function getAngle(token: NumberToken | AngleToken | IdentToken): number {
    if (token.typ == EnumToken.IdenTokenType) {
        if (token.val == "none") {
            return 0;
        }
    }

    if (token.typ == EnumToken.AngleTokenType) {
        switch ((token as AngleToken).unit) {
            case "deg":
                // @ts-ignore
                return token.val / 360;

            case "rad":
                // @ts-ignore
                return token.val / (2 * Math.PI);

            case "grad":
                // @ts-ignore
                return token.val / 400;

            case "turn":
                // @ts-ignore
                return +token.val;
        }
    }

    // @ts-ignore
    return token.val / 360;
}

export function toPrecisionValue(value: number, precision: number = colorPrecision): number {
    const div: number = Math.pow(10, precision);
    value = Math.round(value * div) / div;

    return Math.abs(value) < epsilon ? 0 : value;
}

export function toPrecisionAngle(
    angle: number,
    precision: number = colorPrecision,
    correctValue: boolean = true,
): number {
    angle = toPrecisionValue(angle, precision);

    if (correctValue && Math.abs(angle) >= 360) {
        angle %= 360;
    }

    if (Math.abs(angle) < anglePrecision) {
        angle = 0;
    }

    if (correctValue && angle < 0) {
        angle += 360;
    }

    return angle;
}
