import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { srgb2rgb, lch2rgb, lab2rgb, oklch2rgb, oklab2rgb, hwb2rgb, hsl2rgb, hex2rgb } from './rgb.js';
import { srgb2hsl, lch2hsl, lab2hsl, oklch2hsl, oklab2hsl, hwb2hsl, hex2hsl, rgb2hsl } from './hsl.js';
import { lch2hwb, lab2hwb, oklch2hwb, oklab2hwb, hsl2hwb, rgb2hwb } from './hwb.js';
import { srgb2lab, oklch2lab, oklab2lab, lch2lab, hwb2lab, hsl2lab, rgb2lab, hex2lab } from './lab.js';
import { srgb2lch, oklch2lch, oklab2lch, lab2lch, hwb2lch, hsl2lch, rgb2lch, hex2lch } from './lch.js';
import { srgb2oklab, oklch2oklab, lch2oklab, lab2oklab, hwb2oklab, hsl2oklab, rgb2oklab, hex2oklab } from './oklab.js';
import { srgb2oklch, lch2oklch, oklab2oklch, lab2oklch, hwb2oklch, hsl2oklch, rgb2oklch, hex2oklch } from './oklch.js';
import { ColorKind, colorFuncColorSpace } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import { xyz2srgb, lsrgb2srgbvalues, srgb2lsrgbvalues, lch2srgb, oklab2srgb, lab2srgb, hwb2srgb, hsl2srgb, rgb2srgb, hex2srgb } from './srgb.js';
import { prophotorgb2srgbvalues, srgb2prophotorgbvalues } from './prophotorgb.js';
import { a98rgb2srgbvalues, srgb2a98values } from './a98rgb.js';
import { rec20202srgb, srgb2rec2020values } from './rec2020.js';
import { srgb2xyz } from './xyz.js';
import { p32srgbvalues, srgb2p3values } from './p3.js';
import { xyzd502srgb, XYZ_D65_to_D50 } from './xyzd50.js';
import '../../renderer/sourcemap/lib/encode.js';

function convert(token, to) {
    if (token.kin == to) {
        return token;
    }
    if (token.kin == ColorKind.COLOR) {
        const colorSpace = token.chi.find(t => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));
        if (colorSpace.val == ColorKind[to].toLowerCase().replaceAll('_', '-')) {
            return token;
        }
    }
    let values = [];
    if (to == ColorKind.HSL) {
        let t;
        switch (token.kin) {
            case ColorKind.RGB:
            case ColorKind.RGBA:
                t = rgb2hsl(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.HEX:
            case ColorKind.LIT:
                values.push(...hex2hsl(token));
                break;
            case ColorKind.HWB:
                values.push(...hwb2hsl(token));
                break;
            case ColorKind.OKLAB:
                t = oklab2hsl(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.OKLCH:
                t = oklch2hsl(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.LAB:
                values.push(...lab2hsl(token));
                break;
            case ColorKind.LCH:
                values.push(...lch2hsl(token));
                break;
            case ColorKind.COLOR:
                // @ts-ignore
                values.push(...srgb2hsl(...color2srgbvalues(token)));
                break;
        }
        if (values.length > 0) {
            return values2hsltoken(values);
        }
    }
    else if (to == ColorKind.HWB) {
        switch (token.kin) {
            case ColorKind.RGB:
            case ColorKind.RGBA:
                values.push(...rgb2hwb(token));
                break;
            case ColorKind.HEX:
            case ColorKind.LIT:
                values.push(...hex2hsl(token));
                break;
            case ColorKind.HSL:
            case ColorKind.HSLA:
                values.push(...hsl2hwb(token));
                break;
            case ColorKind.OKLAB:
                values.push(...oklab2hwb(token));
                break;
            case ColorKind.OKLCH:
                values.push(...oklch2hwb(token));
                break;
            case ColorKind.LAB:
                values.push(...lab2hwb(token));
                break;
            case ColorKind.LCH:
                values.push(...lch2hwb(token));
                break;
        }
        if (values.length > 0) {
            return values2hwbtoken(values);
        }
    }
    else if (to == ColorKind.RGB) {
        let t;
        switch (token.kin) {
            case ColorKind.HEX:
            case ColorKind.LIT:
                values.push(...hex2rgb(token));
                break;
            case ColorKind.HSL:
                t = hsl2rgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.HWB:
                t = hwb2rgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.OKLAB:
                t = oklab2rgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.OKLCH:
                t = oklch2rgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.LAB:
                t = lab2rgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.LCH:
                t = lch2rgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.COLOR:
                // @ts-ignore
                values.push(...srgb2rgb(...color2srgbvalues(token)));
                break;
        }
        if (values.length > 0) {
            return values2rgbtoken(values);
        }
    }
    else if (to == ColorKind.LAB) {
        switch (token.kin) {
            case ColorKind.HEX:
            case ColorKind.LIT:
                values.push(...hex2lab(token));
                break;
            case ColorKind.RGB:
            case ColorKind.RGBA:
                values.push(...rgb2lab(token));
                break;
            case ColorKind.HSL:
            case ColorKind.HSLA:
                values.push(...hsl2lab(token));
                break;
            case ColorKind.HWB:
                values.push(...hwb2lab(token));
                break;
            case ColorKind.LCH:
                values.push(...lch2lab(token));
                break;
            case ColorKind.OKLAB:
                values.push(...oklab2lab(token));
                break;
            case ColorKind.OKLCH:
                values.push(...oklch2lab(token));
                break;
            case ColorKind.COLOR:
                // @ts-ignore
                values.push(...srgb2lab(...color2srgbvalues(token)));
                break;
        }
        if (values.length > 0) {
            return values2colortoken(values, to);
        }
    }
    else if (to == ColorKind.LCH) {
        switch (token.kin) {
            case ColorKind.HEX:
            case ColorKind.LIT:
                values.push(...hex2lch(token));
                break;
            case ColorKind.RGB:
            case ColorKind.RGBA:
                values.push(...rgb2lch(token));
                break;
            case ColorKind.HSL:
            case ColorKind.HSLA:
                values.push(...hsl2lch(token));
                break;
            case ColorKind.HWB:
                values.push(...hwb2lch(token));
                break;
            case ColorKind.LAB:
                values.push(...lab2lch(token));
                break;
            case ColorKind.OKLAB:
                values.push(...oklab2lch(token));
                break;
            case ColorKind.OKLCH:
                values.push(...oklch2lch(token));
                break;
            case ColorKind.COLOR:
                // @ts-ignore
                values.push(...srgb2lch(...color2srgbvalues(token)));
                break;
        }
        if (values.length > 0) {
            return values2colortoken(values, to);
        }
    }
    else if (to == ColorKind.OKLAB) {
        switch (token.kin) {
            case ColorKind.HEX:
            case ColorKind.LIT:
                values.push(...hex2oklab(token));
                break;
            case ColorKind.RGB:
            case ColorKind.RGBA:
                values.push(...rgb2oklab(token));
                break;
            case ColorKind.HSL:
            case ColorKind.HSLA:
                values.push(...hsl2oklab(token));
                break;
            case ColorKind.HWB:
                values.push(...hwb2oklab(token));
                break;
            case ColorKind.LAB:
                values.push(...lab2oklab(token));
                break;
            case ColorKind.LCH:
                values.push(...lch2oklab(token));
                break;
            case ColorKind.OKLCH:
                values.push(...oklch2oklab(token));
                break;
            case ColorKind.COLOR:
                // @ts-ignore
                values.push(...srgb2oklab(...color2srgbvalues(token)));
                break;
        }
        if (values.length > 0) {
            return values2colortoken(values, to);
        }
    }
    else if (to == ColorKind.OKLCH) {
        switch (token.kin) {
            case ColorKind.HEX:
            case ColorKind.LIT:
                values.push(...hex2oklch(token));
                break;
            case ColorKind.RGB:
            case ColorKind.RGBA:
                values.push(...rgb2oklch(token));
                break;
            case ColorKind.HSL:
            case ColorKind.HSLA:
                values.push(...hsl2oklch(token));
                break;
            case ColorKind.HWB:
                values.push(...hwb2oklch(token));
                break;
            case ColorKind.LAB:
                values.push(...lab2oklch(token));
                break;
            case ColorKind.OKLAB:
                values.push(...oklab2oklch(token));
                break;
            case ColorKind.LCH:
                values.push(...lch2oklch(token));
                break;
            case ColorKind.COLOR:
                // @ts-ignore
                values.push(...srgb2oklch(...color2srgbvalues(token)));
                // switch (to) {
                //
                //     case ColorKind.SRGB:
                //
                //         values.push(...val);
                //         break;
                //
                //     case ColorKind.SRGB_LINEAR:
                //
                //         // @ts-ignore
                //         values.push(...srgb2lsrgbvalues(...val));
                //         break;
                //
                //     case ColorKind.DISPLAY_P3:
                //
                //         // @ts-ignore
                //         values.push(...srgb2p3values(...val));
                //         break;
                //
                //     case ColorKind.PROPHOTO_RGB:
                //
                //         // @ts-ignore
                //         values.push(...srgb2prophotorgbvalues(...val));
                //         break;
                //
                //     case ColorKind.A98_RGB:
                //
                //         // @ts-ignore
                //         values.push(...srgb2a98values(...val));
                //         break;
                //
                //     case ColorKind.REC2020:
                //
                //         // @ts-ignore
                //         values.push(...srgb2rec2020values(...val));
                //         break;
                //
                //     case ColorKind.XYZ:
                //     case ColorKind.XYZ_D65:
                //
                //         // @ts-ignore
                //         values.push(...srgb2xyz(...val));
                //         break;
                //
                //     case ColorKind.XYZ_D50:
                //
                //         // @ts-ignore
                //         values.push(...(XYZ_D65_to_D50(...srgb2xyz(...val))));
                //         break;
                // }
                break;
        }
        if (values.length > 0) {
            return values2colortoken(values, to);
        }
    }
    else if (colorFuncColorSpace.includes(ColorKind[to].toLowerCase().replaceAll('_', '-'))) {
        let t;
        switch (token.kin) {
            case ColorKind.HEX:
            case ColorKind.LIT:
                values.push(...hex2srgb(token));
                break;
            case ColorKind.RGB:
            case ColorKind.RGBA:
                t = rgb2srgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.HSL:
            case ColorKind.HSLA:
                t = hsl2srgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.HWB:
                t = hwb2srgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.LAB:
                t = lab2srgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.OKLAB:
                t = oklab2srgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.LCH:
                t = lch2srgb(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.OKLCH:
                t = color2srgbvalues(token);
                if (t == null) {
                    return null;
                }
                values.push(...t);
                break;
            case ColorKind.COLOR:
                const val = color2srgbvalues(token);
                if (val == null) {
                    return null;
                }
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
                        values.push(...(XYZ_D65_to_D50(...srgb2xyz(...val))));
                        break;
                }
                break;
        }
        if (values.length > 0) {
            return values2colortoken(values, to);
        }
    }
    return null;
}
function minmax(value, min, max) {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}
function color2srgbvalues(token) {
    const components = getComponents(token);
    if (components == null) {
        return null;
    }
    const colorSpace = components.shift();
    let values = components.map((val) => getNumber(val));
    switch (colorSpace.val) {
        case 'display-p3':
            // @ts-ignore
            values = p32srgbvalues(...values);
            break;
        case 'srgb-linear':
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
function values2hsltoken(values) {
    const to = ColorKind.HSL;
    const chi = [
        { typ: EnumToken.AngleTokenType, val: String(values[0] * 360), unit: 'deg' },
        { typ: EnumToken.PercentageTokenType, val: String(values[1] * 100) },
        { typ: EnumToken.PercentageTokenType, val: String(values[2] * 100) },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.PercentageTokenType, val: String(values[3] * 100) });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: ColorKind[to].toLowerCase().replaceAll('_', '-'),
        chi,
        kin: to
    };
}
function values2rgbtoken(values) {
    const to = ColorKind.RGB;
    const chi = [
        { typ: EnumToken.NumberTokenType, val: String(values[0]) },
        { typ: EnumToken.NumberTokenType, val: String(values[1]) },
        { typ: EnumToken.NumberTokenType, val: String(values[2]) },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.PercentageTokenType, val: String(values[3] * 100) });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: ColorKind[to],
        chi,
        kin: to
    };
}
function values2hwbtoken(values) {
    const to = ColorKind.HWB;
    const chi = [
        { typ: EnumToken.AngleTokenType, val: String(values[0] * 360), unit: 'deg' },
        { typ: EnumToken.PercentageTokenType, val: String(values[1] * 100) },
        { typ: EnumToken.PercentageTokenType, val: String(values[2] * 100) },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.PercentageTokenType, val: String(values[3] * 100) });
    }
    return {
        typ: EnumToken.ColorTokenType,
        val: ColorKind[to],
        chi,
        kin: to
    };
}
function values2colortoken(values, to) {
    const chi = [
        { typ: EnumToken.NumberTokenType, val: String(values[0]) },
        { typ: EnumToken.NumberTokenType, val: String(values[1]) },
        { typ: EnumToken.NumberTokenType, val: String(values[2]) },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.PercentageTokenType, val: String(values[3] * 100) });
    }
    const colorSpace = ColorKind[to].toLowerCase().replaceAll('_', '-');
    return colorFuncColorSpace.includes(colorSpace) ? {
        typ: EnumToken.ColorTokenType,
        val: 'color',
        chi: [{ typ: EnumToken.IdenTokenType, val: colorSpace }].concat(chi),
        kin: ColorKind.COLOR
    } : {
        typ: EnumToken.ColorTokenType,
        val: colorSpace,
        chi,
        kin: to
    };
}
/**
 * clamp color values
 * @param token
 */
function clamp(token) {
    if (token.kin == ColorKind.RGB || token.kin == ColorKind.RGBA) {
        token.chi.filter((token) => ![EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(token.typ)).forEach((token, index) => {
            if (index <= 2) {
                if (token.typ == EnumToken.NumberTokenType) {
                    token.val = String(minmax(+token.val, 0, 255));
                }
                else if (token.typ == EnumToken.PercentageTokenType) {
                    token.val = String(minmax(+token.val, 0, 100));
                }
            }
            else {
                if (token.typ == EnumToken.NumberTokenType) {
                    token.val = String(minmax(+token.val, 0, 1));
                }
                else if (token.typ == EnumToken.PercentageTokenType) {
                    token.val = String(minmax(+token.val, 0, 100));
                }
            }
        });
    }
    return token;
}
function getNumber(token) {
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
function getAngle(token) {
    if (token.typ == EnumToken.IdenTokenType) {
        if (token.val == 'none') {
            return 0;
        }
    }
    if (token.typ == EnumToken.AngleTokenType) {
        switch (token.unit) {
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

export { clamp, color2srgbvalues, convert, getAngle, getNumber, minmax, values2hsltoken };
