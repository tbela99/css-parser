import type {AngleToken, ColorToken, IdentToken, NumberToken, PercentageToken, Token} from "../../../@types/index.d.ts";
import {EnumToken} from "../../ast/index.ts";
import {
    cmyk2RgbToken,
    cmyk2rgbvalues,
    color2RgbToken,
    hex2RgbToken,
    hsl2RgbToken,
    hwb2RgbToken,
    lab2RgbToken,
    lch2RgbToken,
    oklab2RgbToken,
    oklch2RgbToken
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
    rgb2HslToken
} from "./hsl.ts";
import {
    cmyk2hwbToken,
    color2hwbToken,
    hsl2hwbToken,
    lab2hwbToken,
    lch2hwbToken,
    oklab2hwbToken,
    oklch2hwbToken,
    rgb2hwbToken
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
    rgb2labToken
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
    rgb2lchToken
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
    rgb2oklabToken
} from "./oklab.ts";
import {
    color2oklchToken,
    hex2oklchToken,
    hsl2oklchToken,
    hwb2oklchToken,
    lab2oklchToken,
    lch2oklchToken,
    oklab2oklchToken,
    rgb2oklchToken,
} from "./oklch.ts";
import {anglePrecision, colorFuncColorSpace, ColorKind, colorPrecision, getComponents} from "./utils/index.ts";
import {
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
    xyz2srgb
} from "./srgb.ts";
import {prophotorgb2srgbvalues, srgb2prophotorgbvalues} from "./prophotorgb.ts";
import {rec20202srgb, srgb2rec2020values} from "./rec2020.ts";
import {srgb2xyz, srgb2xyz_d50} from "./xyz.ts";
import {p32srgbvalues, srgb2p3values} from "./p3.ts";
import {xyzd502srgb} from "./xyzd50.ts";
import {colorMix} from "./color-mix.ts";
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
    rgb2HexToken
} from "./hex.ts";
import type {RelativeColorTypes} from "./relativecolor.ts";
import {parseRelativeColor} from "./relativecolor.ts";
import {isIdentColor} from "../syntax.ts";
import {
    color2cmykToken,
    hsl2cmykToken,
    hwb2cmykToken,
    lab2cmykToken,
    lch2cmykToken,
    oklab2cmyk,
    oklch2cmykToken,
    rgb2cmykToken
} from "./cmyk.ts";
import {a98rgb2srgbvalues, srgb2a98values} from "./a98rgb.ts";

export function convertColor(token: ColorToken, to: ColorKind): ColorToken | null {

    if (token.kin == ColorKind.SYS ||
        token.kin == ColorKind.DPSYS ||
        (isIdentColor(token) &&
            ('currentcolor'.localeCompare(token.val, undefined, {sensitivity: 'base'}) == 0))
    ) {

        return token
    }

    if (token.kin == ColorKind.COLOR_MIX && to != ColorKind.COLOR_MIX) {

        const children: Token[][] = (<Token[]>(token as ColorToken).chi).reduce((acc: Token[][], t: Token) => {

            if (t.typ == EnumToken.ColorTokenType) {

                acc.push([t]);
            } else {

                if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType].includes(t.typ)) {

                    acc[acc.length - 1].push(t);
                }
            }

            return acc;
        }, <Token[][]>[[]]);

        token = colorMix(<IdentToken>children[0][1], <IdentToken>children[0][2], <ColorToken>children[1][0], <PercentageToken>children[1][1], <ColorToken>children[2][0], <PercentageToken>children[2][1]) as ColorToken;

        if (token == null) {

            return null;
        }
    }

    if ((token as ColorToken).cal == 'rel' && ['rgb', 'hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'].includes((token as ColorToken).val.toLowerCase())) {

        const chi: Token[] | null = getComponents(token as ColorToken);
        const offset: number = (token as ColorToken).val == 'color' ? 2 : 1;

        if (chi != null) {

            // @ts-ignore
            const color: ColorToken = chi[1];
            const components: Record<RelativeColorTypes, Token> = <Record<RelativeColorTypes, Token>>parseRelativeColor((token as ColorToken).val.toLowerCase() == 'color' ? (<IdentToken>chi[offset]).val : <string>(token as ColorToken).val, color, chi[offset + 1], chi[offset + 2], chi[offset + 3], chi[offset + 4]);

            if (components != null) {

                token = {
                    ...token,
                    chi: [...((token as ColorToken).val == 'color' ? [chi[offset]] : []), ...Object.values(components)]
                };

                delete (token as ColorToken).cal;
            }
        }
    }

    if (token.kin == to) {

        if (token.kin == ColorKind.HEX || token.kin == ColorKind.LIT) {

            token.val = reduceHexValue(token.val);
            token.kin = token.val[0] == '#' ? ColorKind.HEX : ColorKind.LIT;
        }

        return token;
    }

    if (token.kin == ColorKind.COLOR) {

        const colorSpace: IdentToken = <IdentToken>(<Token[]>token.chi).find(t => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));

        if (colorSpace.val == ColorKind[to].toLowerCase().replaceAll('_', '-')) {

            return token;
        }
    }

    if (to == ColorKind.HSL) {


        switch (token.kin) {

            case ColorKind.RGB:
            case ColorKind.RGBA:

                return rgb2HslToken(token);

            case ColorKind.HEX:
            case ColorKind.LIT:

                return hex2HslToken(token);

            case ColorKind.HWB:

                return hwb2HslToken(token);

            case ColorKind.DEVICE_CMYK:

                return cmyk2HslToken(token);

            case ColorKind.OKLAB:

                return oklab2HslToken(token);

            case ColorKind.OKLCH:

                return oklch2HslToken(token);

            case ColorKind.LAB:

                return lab2HslToken(token);

            case ColorKind.LCH:

                return lch2HslToken(token);

            case ColorKind.COLOR:

                return color2HslToken(token);
        }

    } else if (to == ColorKind.HWB) {

        switch (token.kin) {

            case ColorKind.RGB:
            case ColorKind.RGBA:

                return rgb2hwbToken(token);

            case ColorKind.HEX:
            case ColorKind.LIT:

                // @ts-ignore
                return rgb2hwbToken(token);

            case ColorKind.HSL:
            case ColorKind.HSLA:

                return hsl2hwbToken(token);

            case ColorKind.OKLAB:

                return oklab2hwbToken(token);

            case ColorKind.OKLCH:

                return oklch2hwbToken(token);

            case ColorKind.LAB:

                return lab2hwbToken(token);

            case ColorKind.LCH:

                return lch2hwbToken(token);

            case ColorKind.DEVICE_CMYK:

                return cmyk2hwbToken(token);

            case ColorKind.COLOR:

                return color2hwbToken(token);
        }

    } else if (to == ColorKind.DEVICE_CMYK) {

        switch (token.kin) {

            case ColorKind.RGB:
            case ColorKind.RGBA:

                return rgb2cmykToken(token);

            case ColorKind.HEX:
            case ColorKind.LIT:

                return rgb2cmykToken(token);

            case ColorKind.HSL:
            case ColorKind.HSLA:

                return hsl2cmykToken(token);

            case ColorKind.HWB:

                return hwb2cmykToken(token);

            case ColorKind.OKLAB:

                return oklab2cmyk(token);

            case ColorKind.OKLCH:

                return oklch2cmykToken(token);

            case ColorKind.LAB:

                return lab2cmykToken(token);
            //
            case ColorKind.LCH:

                return lch2cmykToken(token);

            case ColorKind.COLOR:

                return color2cmykToken(token);

        }
    } else if (to == ColorKind.HEX || to == ColorKind.LIT) {
        switch (token.kin) {

            case ColorKind.HEX:
            case ColorKind.LIT: {

                const val = reduceHexValue(token.val);

                return {
                    typ: EnumToken.ColorTokenType,
                    val,
                    kin: val[0] == '#' ? ColorKind.HEX : ColorKind.LIT
                }
            }

            case ColorKind.HSL:

                return hsl2HexToken(token);

            case ColorKind.HWB:

                return hwb2HexToken(token);

            case ColorKind.DEVICE_CMYK:

                return cmyk2HexToken(token);

            case ColorKind.OKLAB:

                return oklab2HexToken(token);

            case ColorKind.OKLCH:

                return oklch2HexToken(token);

            case ColorKind.LAB:

                return lab2HexToken(token);

            case ColorKind.LCH:

                return lch2HexToken(token);

            case ColorKind.COLOR:

                return color2HexToken(token);

            case ColorKind.RGB:
            case ColorKind.RGBA:

                return rgb2HexToken(token);
        }

    } else if (to == ColorKind.RGB) {
        switch (token.kin) {

            case ColorKind.HEX:
            case ColorKind.LIT:

                return hex2RgbToken(token);

            case ColorKind.HSL:

                return hsl2RgbToken(token);

            case ColorKind.HWB:

                return hwb2RgbToken(token);

            case ColorKind.DEVICE_CMYK:

                return cmyk2RgbToken(token);

            case ColorKind.OKLAB:

                return oklab2RgbToken(token);

            case ColorKind.OKLCH:

                return oklch2RgbToken(token);

            case ColorKind.LAB:

                return lab2RgbToken(token);

            case ColorKind.LCH:

                return lch2RgbToken(token);

            case ColorKind.COLOR:

                return color2RgbToken(token);
        }

    } else if (to == ColorKind.LAB) {

        switch (token.kin) {

            case ColorKind.HEX:
            case ColorKind.LIT:

                return hex2labToken(token);

            case ColorKind.RGB:
            case ColorKind.RGBA:

                return rgb2labToken(token);

            case ColorKind.HSL:
            case ColorKind.HSLA:

                return hsl2labToken(token);

            case ColorKind.HWB:

                return hwb2labToken(token);

            case ColorKind.DEVICE_CMYK:

                return cmyk2labToken(token);

            case ColorKind.LCH:

                return lch2labToken(token);

            case ColorKind.OKLAB:

                return oklab2labToken(token);

            case ColorKind.OKLCH:

                return oklch2labToken(token);

            case ColorKind.COLOR:

                return color2labToken(token);
        }

    } else if (to == ColorKind.LCH) {

        switch (token.kin) {

            case ColorKind.HEX:
            case ColorKind.LIT:
                return hex2lchToken(token);

            case ColorKind.RGB:
            case ColorKind.RGBA:

                return rgb2lchToken(token);

            case ColorKind.HSL:
            case ColorKind.HSLA:

                return hsl2lchToken(token);

            case ColorKind.HWB:

                return hwb2lchToken(token);

            case ColorKind.DEVICE_CMYK:

                return cmyk2lchToken(token);

            case ColorKind.LAB:

                return lab2lchToken(token);

            case ColorKind.OKLAB:

                return oklab2lchToken(token);

            case ColorKind.OKLCH:

                return oklch2lchToken(token);

            case ColorKind.COLOR:

                return color2lchToken(token);
        }

    } else if (to == ColorKind.OKLAB) {

        switch (token.kin) {

            case ColorKind.HEX:
            case ColorKind.LIT:

                return hex2oklabToken(token);

            case ColorKind.RGB:
            case ColorKind.RGBA:

                return rgb2oklabToken(token);

            case ColorKind.HSL:
            case ColorKind.HSLA:

                return hsl2oklabToken(token);

            case ColorKind.HWB:

                return hwb2oklabToken(token);

            case ColorKind.DEVICE_CMYK:

                return cmyk2oklabToken(token);

            case ColorKind.LAB:

                return lab2oklabToken(token);

            case ColorKind.LCH:

                return lch2oklabToken(token);

            case ColorKind.OKLCH:

                return oklch2oklabToken(token);

            case ColorKind.COLOR:

                return color2oklabToken(token);
        }

    } else if (to == ColorKind.OKLCH) {

        switch (token.kin) {

            case ColorKind.HEX:
            case ColorKind.LIT:

                return hex2oklchToken(token);

            case ColorKind.RGB:
            case ColorKind.RGBA:

                return rgb2oklchToken(token);

            case ColorKind.HSL:
            case ColorKind.HSLA:

                return hsl2oklchToken(token);

            case ColorKind.HWB:

                return hwb2oklchToken(token);

            case ColorKind.DEVICE_CMYK:

                return oklab2oklchToken(token);

            case ColorKind.LAB:

                return lab2oklchToken(token);

            case ColorKind.OKLAB:

                return oklab2oklchToken(token);

            case ColorKind.LCH:

                return lch2oklchToken(token);

            case ColorKind.COLOR:

                return color2oklchToken(token);
        }

    } else if (colorFuncColorSpace.includes((ColorKind[to].toLowerCase().replaceAll('_', '-') as string).toLowerCase().replaceAll('_', '-'))) {

        console.error(ColorKind[token.kin]);

        switch (token.kin) {

            case ColorKind.HEX:
            case ColorKind.LIT:

                return hex2colorToken(token, to);

            case ColorKind.RGB:
            case ColorKind.RGBA:

                return rgb2colorToken(token, to);

            case ColorKind.HSL:
            case ColorKind.HSLA:

                return hsl2colorToken(token, to);

            case ColorKind.HWB:

                return hwb2colorToken(token, to);

            case ColorKind.DEVICE_CMYK:

                return cmyk2colorToken(token, to);

            case ColorKind.LAB:

                return lab2colorToken(token, to);
            case ColorKind.OKLAB:

                return oklab2colorToken(token, to);

            case ColorKind.LCH:

                return lch2colorToken(token, to);

            case ColorKind.OKLCH:

                return oklch2colorToken(token, to);

            case ColorKind.COLOR:
            case ColorKind.XYZ:
            case ColorKind.SRGB:
            case ColorKind.REC2020:
            case ColorKind.XYZ_D50:
            case ColorKind.A98_RGB:
            case ColorKind.DISPLAY_P3:
            case ColorKind.SRGB_LINEAR:
            case ColorKind.PROPHOTO_RGB:

                return color2colorToken(token, to);
        }
    }

    return null;
}

export function hex2colorToken(token: ColorToken, to: ColorKind): ColorToken | null {

    const values: number[] = hex2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function rgb2colorToken(token: ColorToken, to: ColorKind): ColorToken | null {

    const values: number[] | null = rgb2srgb(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function hsl2colorToken(token: ColorToken, to: ColorKind): ColorToken | null {

    const values: number[] | null = hsl2srgb(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function hwb2colorToken(token: ColorToken, to: ColorKind): ColorToken | null {

    const values: number[] | null = hwb2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function cmyk2colorToken(token: ColorToken, to: ColorKind): ColorToken | null {

    const values: number[] | null = cmyk2rgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function lab2colorToken(token: ColorToken, to: ColorKind): ColorToken | null {

    const values: number[] | null = lab2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function oklab2colorToken(token: ColorToken, to: ColorKind): ColorToken | null {

    const values: number[] | null = oklab2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function lch2colorToken(token: ColorToken, to: ColorKind): ColorToken | null {

    const values: number[] | null = lch2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function oklch2colorToken(token: ColorToken, to: ColorKind): ColorToken | null {

    const values: number[] | null = oklch2srgbvalues(token);

    if (values == null) {
        return null;
    }

    return values2colortoken(values, to);
}

export function color2colorToken(token: ColorToken, to: ColorKind): ColorToken | null {

    const values: number[] | null = color2srgbvalues(token);

    if (values == null) {
        return null;
    }

    console.error({srgb: values});

    return values2colortoken(values, to);
}

function srgb2srgbcolorspace(val: number[], to: ColorKind): number[] {

    const values: number[] = [];

    switch (to) {

        case ColorKind.SRGB:

            values.push(...val);
            break;
        case ColorKind.SRGB_LINEAR:

            // @ts-ignore
            values.push(...srgb2lsrgbvalues(...val));
            break;
        case ColorKind.DISPLAY_P3:

            // @ts-ignore
            values.push(...srgb2p3values(...val));
            break;
        case ColorKind.PROPHOTO_RGB:

            // @ts-ignore
            values.push(...srgb2prophotorgbvalues(...val));
            break;
        case ColorKind.A98_RGB:

            // @ts-ignore
            values.push(...srgb2a98values(...val));
            break;

        case ColorKind.REC2020:

            // @ts-ignore
            values.push(...srgb2rec2020values(...val));
            break;

        case ColorKind.XYZ:
        case ColorKind.XYZ_D65:

            // @ts-ignore
            values.push(...srgb2xyz(...val));
            break;

        case ColorKind.XYZ_D50:

            // @ts-ignore
            values.push(...srgb2xyz_d50(...val));
            break
    }

    return values;
}

export function minmax(value: number, min: number, max: number): number {

    if (value < min) {

        return min;
    }

    if (value > max) {

        return max;
    }

    return value;
}

export function color2srgbvalues(token: ColorToken): number[] | null {

    const components: Token[] = getComponents(token) as Token[];

    if (components == null) {

        return null;
    }

    const colorSpace: IdentToken = <IdentToken>components.shift();
    let values: number[] = components.map((val: Token) => getNumber(<IdentToken | NumberToken | PercentageToken>val));

    switch (colorSpace.val.toLowerCase()) {

        case  'display-p3':
            // @ts-ignore
            values = p32srgbvalues(...values);
            break;
        case  'srgb-linear':
            // @ts-ignore
            values = lsrgb2srgbvalues(...values);
            break;
        case 'prophoto-rgb':

            // @ts-ignore
            values = prophotorgb2srgbvalues(...values);
            break;
        case 'a98-rgb':
            // @ts-ignore
            values = a98rgb2srgbvalues(...values);
            break;
        case 'rec2020':
            // @ts-ignore
            values = rec20202srgb(...values);
            break;
        case 'xyz':
        case 'xyz-d65':

            // @ts-ignore
            values = xyz2srgb(...values);
            break;
        case 'xyz-d50':
            // @ts-ignore
            values = xyzd502srgb(...values);
            break;

        // case srgb:
    }

    return values;
}


function values2colortoken(values: number[], to: ColorKind): ColorToken {

    // console.error({srgb2: values});

    values = srgb2srgbcolorspace(values, to);

    // console.error({srgb3: values, to: ColorKind[to]});

    const chi: Token[] = <Token[]>[

        {typ: EnumToken.NumberTokenType, val: String(values[0])},
        {typ: EnumToken.NumberTokenType, val: String(values[1])},
        {typ: EnumToken.NumberTokenType, val: String(values[2])},
    ];

    if (values.length == 4) {

        chi.push({typ: EnumToken.PercentageTokenType, val: (values[3] * 100).toFixed()});
    }

    const colorSpace: string = ColorKind[to].toLowerCase().replaceAll('_', '-');

    return colorFuncColorSpace.includes(colorSpace) ? <ColorToken>{
        typ: EnumToken.ColorTokenType,
        val: 'color',
        chi: [<Token>{typ: EnumToken.IdenTokenType, val: colorSpace}].concat(chi),
        kin: ColorKind.COLOR
    } : <ColorToken>{
        typ: EnumToken.ColorTokenType,
        val: colorSpace,
        chi,
        kin: to
    }
}

/**
 * clamp color values
 * @param token
 */
export function clamp(token: ColorToken): ColorToken {

    if (token.kin == ColorKind.RGB) {

        (<Token[]>token.chi).filter((token: Token) => ![EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(token.typ)).forEach((token: Token, index: number) => {

            if (index <= 2) {

                if (token.typ == EnumToken.NumberTokenType) {

                    (token as NumberToken).val = String(minmax(+(token as NumberToken).val, 0, 255));

                } else if (token.typ == EnumToken.PercentageTokenType) {

                    (token as PercentageToken).val = String(minmax(+(token as PercentageToken).val, 0, 100));
                }
            } else {

                if (token.typ == EnumToken.NumberTokenType) {

                    (token as NumberToken).val = String(minmax(+(token as NumberToken).val, 0, 1));

                } else if (token.typ == EnumToken.PercentageTokenType) {

                    (token as PercentageToken).val = String(minmax(+(token as PercentageToken).val, 0, 100));
                }
            }
        });
    }

    return token;
}

export function getNumber(token: NumberToken | PercentageToken | IdentToken): number {

    if (token.typ == EnumToken.IdenTokenType && token.val == 'none') {

        return 0;
    }

    // @ts-ignore
    return token.typ == EnumToken.PercentageTokenType ? token.val / 100 : +token.val;
}

/**
 * convert angle to turn
 * @param token
 */
export function getAngle(token: NumberToken | AngleToken | IdentToken): number {

    if (token.typ == EnumToken.IdenTokenType) {

        if (token.val == 'none') {

            return 0;
        }
    }

    if (token.typ == EnumToken.AngleTokenType) {

        switch ((token as AngleToken).unit) {

            case 'deg':

                // @ts-ignore
                return token.val / 360;

            case 'rad':

                // @ts-ignore
                return token.val / (2 * Math.PI);

            case 'grad':

                // @ts-ignore
                return token.val / 400;

            case 'turn':

                // @ts-ignore
                return +token.val;

        }
    }

    // @ts-ignore
    return token.val / 360;
}

export function toPrecisionAngle(angle: number): number {


    angle = +angle.toPrecision(colorPrecision);

    if (Math.abs(angle) >= 360) {

        angle %= 360;
    }


    if (Math.abs(angle) < anglePrecision) {

        angle = 0;
    }

    if (angle < 0) {

        angle += 360;
    }

    return angle;
}
