import type {
    AngleToken,
    ColorKind,
    ColorSpace,
    ColorToken,
    IdentToken,
    NumberToken,
    PercentageToken,
    Token
} from "../../../@types/index.d.ts";
import {EnumToken} from "../../ast/index.ts";
import {hex2rgb, hsl2rgb, hwb2rgb, lab2rgb, lch2rgb, oklab2rgb, oklch2rgb, srgb2rgb} from "./rgb.ts";
import {hex2hsl, hwb2hsl, lab2hsl, lch2hsl, oklab2hsl, oklch2hsl, rgb2hsl, srgb2hsl} from "./hsl.ts";
import {hsl2hwb, lab2hwb, lch2hwb, oklab2hwb, oklch2hwb, rgb2hwb} from "./hwb.ts";
import {hex2lab, hsl2lab, hwb2lab, lch2lab, oklab2lab, oklch2lab, rgb2lab, srgb2lab} from "./lab.ts";
import {hex2lch, hsl2lch, hwb2lch, lab2lch, oklab2lch, oklch2lch, rgb2lch, srgb2lch} from "./lch.ts";
import {hex2oklab, hsl2oklab, hwb2oklab, lab2oklab, lch2oklab, oklch2oklab, rgb2oklab, srgb2oklab} from "./oklab.ts";
import {hex2oklch, hsl2oklch, hwb2oklch, lab2oklch, lch2oklch, oklab2oklch, rgb2oklch,} from "./oklch.ts";
import {colorFuncColorSpace, getComponents} from "./utils/index.ts";
import {
    hex2srgb,
    hsl2srgb,
    hwb2srgb,
    lab2srgb,
    lch2srgb,
    lsrgb2srgbvalues,
    oklab2srgb,
    rgb2srgb,
    srgb2lsrgbvalues,
    xyz2srgb
} from "./srgb.ts";
import {prophotorgb2srgbvalues, srgb2prophotorgbvalues} from "./prophotorgb.ts";
import {a98rgb2srgbvalues, srgb2a98values} from "./a98rgb.ts";
import {rec20202srgb, srgb2rec2020values} from "./rec2020.ts";
import {srgb2xyz} from "./xyz.ts";
import {p32srgbvalues, srgb2p3values} from "./p3.ts";
import {XYZ_D65_to_D50, xyzd502srgb} from "./xyzd50.ts";

export function convert(token: ColorToken, to: ColorKind | ColorSpace): ColorToken | null {

    if (token.kin == to) {

        return token;
    }

    if (token.kin == 'color') {

        const colorSpace: IdentToken = <IdentToken>(<Token[]>token.chi).find(t => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));

        if (colorSpace.val == to) {

            return token;
        }
    }

    let values: number[] = [];

    if (to == 'hsl') {

        let t: number[] | null;

        switch (token.kin) {

            case 'rgb':
            case 'rgba':

                t = rgb2hsl(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;
            case 'hex':
            case 'lit':

                values.push(...hex2hsl(token));
                break;
            case 'hwb':

                values.push(...hwb2hsl(token));
                break;

            case 'oklab':

                t = oklab2hsl(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'oklch':

                t = oklch2hsl(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'lab':

                values.push(...lab2hsl(token));
                break;

            case 'lch':

                values.push(...lch2hsl(token));
                break;

            case 'color':

                // @ts-ignore
                values.push(...srgb2hsl(...color2srgbvalues(token)));
                break;
        }

        if (values.length > 0) {

            return values2hsltoken(values);
        }
    } else if (to == 'hwb') {

        switch (token.kin) {

            case 'rgb':
            case 'rgba':

                values.push(...rgb2hwb(token));
                break;
            case 'hex':
            case 'lit':

                values.push(...hex2hsl(token));
                break;
            case 'hsl':
            case 'hsla':

                values.push(...hsl2hwb(token));
                break;

            case 'oklab':

                values.push(...oklab2hwb(token));
                break;

            case 'oklch':

                values.push(...oklch2hwb(token));
                break;

            case 'lab':

                values.push(...lab2hwb(token));
                break;

            case 'lch':

                values.push(...lch2hwb(token));
                break;
        }

        if (values.length > 0) {

            return values2hwbtoken(values);
        }
    } else if (to == 'rgb') {
            let t : number[] | null;
        switch (token.kin) {

            case 'hex':
            case 'lit':

                values.push(...hex2rgb(token));
                break
            case 'hsl':

                t = hsl2rgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break
            case 'hwb':

                t = hwb2rgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'oklab':

                t =oklab2rgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'oklch':

                t = oklch2rgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'lab':

                t = lab2rgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'lch':

                t = lch2rgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'color':

                // @ts-ignore
                values.push(...srgb2rgb(...color2srgbvalues(token)));
                break;
        }

        if (values.length > 0) {

            return values2rgbtoken(values);
        }

    } else if (to == 'lab') {

        switch (token.kin) {

            case 'hex':
            case 'lit':

                values.push(...hex2lab(token));
                break;
            case 'rgb':
            case 'rgba':

                values.push(...rgb2lab(token));
                break;
            case 'hsl':
            case 'hsla':

                values.push(...hsl2lab(token));
                break;

            case 'hwb':
                values.push(...hwb2lab(token));
                break;

            case 'lch':
                values.push(...lch2lab(token));
                break;

            case 'oklab':
                values.push(...oklab2lab(token));
                break;

            case 'oklch':
                values.push(...oklch2lab(token));
                break;

            case 'color':
                // @ts-ignore
                values.push(...srgb2lab(...color2srgbvalues(token)));
                break;
        }

        if (values.length > 0) {

            return values2colortoken(values, to);
        }

    } else if (to == 'lch') {

        switch (token.kin) {

            case 'hex':
            case 'lit':

                values.push(...hex2lch(token));
                break;
            case 'rgb':
            case 'rgba':

                values.push(...rgb2lch(token));
                break;
            case 'hsl':
            case 'hsla':

                values.push(...hsl2lch(token));
                break;

            case 'hwb':
                values.push(...hwb2lch(token));
                break;

            case 'lab':
                values.push(...lab2lch(token));
                break;

            case 'oklab':
                values.push(...oklab2lch(token));
                break;

            case 'oklch':
                values.push(...oklch2lch(token));
                break;

            case 'color':
                // @ts-ignore
                values.push(...srgb2lch(...color2srgbvalues(token)));
                break;
        }

        if (values.length > 0) {

            return values2colortoken(values, to);
        }

    } else if (to == 'oklab') {

        switch (token.kin) {

            case 'hex':
            case 'lit':

                values.push(...hex2oklab(token));
                break;
            case 'rgb':
            case 'rgba':

                values.push(...rgb2oklab(token));
                break;
            case 'hsl':
            case 'hsla':

                values.push(...hsl2oklab(token));
                break;

            case 'hwb':
                values.push(...hwb2oklab(token));
                break;

            case 'lab':
                values.push(...lab2oklab(token));
                break;

            case 'lch':
                values.push(...lch2oklab(token));
                break;

            case 'oklch':
                values.push(...oklch2oklab(token));
                break;

            case 'color':
                // @ts-ignore
                values.push(...srgb2oklab(...color2srgbvalues(token)));
                break;
        }

        if (values.length > 0) {

            return values2colortoken(values, to);
        }

    } else if (to == 'oklch') {

        switch (token.kin) {

            case 'hex':
            case 'lit':

                values.push(...hex2oklch(token));
                break;
            case 'rgb':
            case 'rgba':

                values.push(...rgb2oklch(token));
                break;
            case 'hsl':
            case 'hsla':

                values.push(...hsl2oklch(token));
                break;

            case 'hwb':
                values.push(...hwb2oklch(token));
                break;

            case 'lab':
                values.push(...lab2oklch(token));
                break;

            case 'oklab':
                values.push(...oklab2oklch(token));
                break;

            case 'lch':
                values.push(...lch2oklch(token));
                break;

            case 'color':

                // @ts-ignore
                let val: number[] = color2srgbvalues(token);

                switch (<ColorSpace>to) {

                    case 'srgb':

                        values.push(...val);
                        break;

                    case 'srgb-linear':

                        // @ts-ignore
                        values.push(...srgb2lsrgbvalues(...val));
                        break;

                    case 'display-p3':

                        // @ts-ignore
                        values.push(...srgb2p3values(...val));
                        break;

                    case 'prophoto-rgb':

                        // @ts-ignore
                        values.push(...srgb2prophotorgbvalues(...val));
                        break;

                    case 'a98-rgb':

                        // @ts-ignore
                        values.push(...srgb2a98values(...val));
                        break;

                    case 'rec2020':

                        // @ts-ignore
                        values.push(...srgb2rec2020values(...val));
                        break;

                    case 'xyz':
                    case 'xyz-d65':

                        // @ts-ignore
                        values.push(...srgb2xyz(...val));
                        break;

                    case 'xyz-d50':

                        // @ts-ignore
                        values.push(...(XYZ_D65_to_D50(...srgb2xyz(...val))));
                        break;
                }

                break;
        }

        if (values.length > 0) {

            return values2colortoken(values, to);
        }
    }

    else if (colorFuncColorSpace.includes(<ColorSpace>to)) {

        let t : number[] | null;

        switch (token.kin) {

            case 'hex':
            case 'lit':

                values.push(...hex2srgb(token));
                break;
            case 'rgb':
            case 'rgba':

                t = rgb2srgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;
            case 'hsl':
            case 'hsla':

                t = hsl2srgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'hwb':

                t = hwb2srgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'lab':
                t = lab2srgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'oklab':

                t = oklab2srgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'lch':

                t = lch2srgb(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'oklch':

                t = color2srgbvalues(token);

                if (t == null) {

                    return null;
                }

                values.push(...t);
                break;

            case 'color':

                const val: number[] | null = color2srgbvalues(token);

                if (val == null) {

                    return null;
                }

                switch (<ColorSpace>to) {

                    case 'srgb':

                        values.push(...val);
                        break;
                    case 'srgb-linear':

                        // @ts-ignore
                        values.push(...srgb2lsrgbvalues(...val));
                        break;
                    case 'display-p3':

                        // @ts-ignore
                        values.push(...srgb2p3values(...val));
                        break;
                    case 'prophoto-rgb':

                        // @ts-ignore
                        values.push(...srgb2prophotorgbvalues(...val));
                        break;
                    case 'a98-rgb':

                        // @ts-ignore
                        values.push(...srgb2a98values(...val));
                        break;

                    case 'rec2020':

                        // @ts-ignore
                        values.push(...srgb2rec2020values(...val));
                        break;

                    case 'xyz':
                    case 'xyz-d65':

                        // @ts-ignore
                        values.push(...srgb2xyz(...val));
                        break;

                    case 'xyz-d50':

                        // @ts-ignore
                        values.push(...(XYZ_D65_to_D50(...srgb2xyz(...val))));
                        break
                }

                break;
        }

        if (values.length > 0) {

            return values2colortoken(values, to);
        }
    }

    return null;
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

    switch (colorSpace.val) {

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

export function values2hsltoken(values: number[]): ColorToken {

    const to: ColorKind = 'hsl';
    const chi: Token[] = <Token[]>[

        {typ: EnumToken.AngleTokenType, val: String(values[0] * 360), unit: 'deg'},
        {typ: EnumToken.PercentageTokenType, val: String(values[1] * 100)},
        {typ: EnumToken.PercentageTokenType, val: String(values[2] * 100)},
    ];

    if (values.length == 4) {

        chi.push({typ: EnumToken.PercentageTokenType, val: String(values[3] * 100)});
    }

    return {
        typ: EnumToken.ColorTokenType,
        val: to,
        chi,
        kin: to
    }
}

function values2rgbtoken(values: number[]): ColorToken {

    const to: ColorKind = 'rgb';
    const chi: Token[] = <Token[]>[

        {typ: EnumToken.NumberTokenType, val: String(values[0])},
        {typ: EnumToken.NumberTokenType, val: String(values[1])},
        {typ: EnumToken.NumberTokenType, val: String(values[2])},
    ];

    if (values.length == 4) {

        chi.push({typ: EnumToken.PercentageTokenType, val: String(values[3] * 100)});
    }

    return {
        typ: EnumToken.ColorTokenType,
        val: to,
        chi,
        kin: to
    }
}

function values2hwbtoken(values: number[]): ColorToken {

    const to: ColorKind = 'hwb';
    const chi: Token[] = <Token[]>[

        {typ: EnumToken.AngleTokenType, val: String(values[0] * 360), unit: 'deg'},
        {typ: EnumToken.PercentageTokenType, val: String(values[1] * 100)},
        {typ: EnumToken.PercentageTokenType, val: String(values[2] * 100)},
    ];

    if (values.length == 4) {

        chi.push({typ: EnumToken.PercentageTokenType, val: String(values[3] * 100)});
    }

    return {
        typ: EnumToken.ColorTokenType,
        val: to,
        chi,
        kin: to
    }
}

function values2colortoken(values: number[], to: ColorKind | ColorSpace): ColorToken {

    const chi: Token[] = <Token[]>[

        {typ: EnumToken.NumberTokenType, val: String(values[0])},
        {typ: EnumToken.NumberTokenType, val: String(values[1])},
        {typ: EnumToken.NumberTokenType, val: String(values[2])},
    ];

    if (values.length == 4) {

        chi.push({typ: EnumToken.PercentageTokenType, val: String(values[3] * 100)});
    }

    return colorFuncColorSpace.includes(<ColorSpace>to) ? <ColorToken> {
        typ: EnumToken.ColorTokenType,
        val: 'color',
        chi: [<Token>{typ: EnumToken.IdenTokenType, val: to}].concat(chi),
        kin: 'color'
    } : <ColorToken>{
        typ: EnumToken.ColorTokenType,
        val: to,
        chi,
        kin: to
    }
}

/**
 * clamp color values
 * @param token
 */
export function clamp(token: ColorToken): ColorToken {

    if (token.kin == 'rgb' || token.kin == 'rgba') {

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
