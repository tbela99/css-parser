import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { isIdentColor } from '../syntax.js';
import { color2RgbToken, lch2RgbToken, lab2RgbToken, oklch2RgbToken, oklab2RgbToken, cmyk2RgbToken, hwb2RgbToken, hsl2RgbToken, hex2RgbToken, cmyk2rgbvalues } from './rgb.js';
import { color2HslToken, lch2HslToken, lab2HslToken, oklch2HslToken, oklab2HslToken, cmyk2HslToken, hwb2HslToken, hex2HslToken, rgb2HslToken } from './hsl.js';
import { color2hwbToken, cmyk2hwbToken, lch2hwbToken, lab2hwbToken, oklch2hwbToken, oklab2hwbToken, hsl2hwbToken, rgb2hwbToken } from './hwb.js';
import { color2labToken, oklch2labToken, oklab2labToken, lch2labToken, cmyk2labToken, hwb2labToken, hsl2labToken, rgb2labToken, hex2labToken } from './lab.js';
import { color2lchToken, oklch2lchToken, oklab2lchToken, lab2lchToken, cmyk2lchToken, hwb2lchToken, hsl2lchToken, rgb2lchToken, hex2lchToken } from './lch.js';
import { color2oklabToken, oklch2oklabToken, lch2oklabToken, lab2oklabToken, cmyk2oklabToken, hwb2oklabToken, hsl2oklabToken, rgb2oklabToken, hex2oklabToken } from './oklab.js';
import { color2oklchToken, lch2oklchToken, oklab2oklchToken, lab2oklchToken, hwb2oklchToken, hsl2oklchToken, rgb2oklchToken, hex2oklchToken } from './oklch.js';
import { ColorKind, colorFuncColorSpace, colorPrecision, anglePrecision } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import { oklch2srgbvalues, lch2srgbvalues, oklab2srgbvalues, lab2srgbvalues, hwb2srgbvalues, hsl2srgb, rgb2srgb, hex2srgbvalues, xyz2srgb, lsrgb2srgbvalues, srgb2lsrgbvalues } from './srgb.js';
import { prophotorgb2srgbvalues, srgb2prophotorgbvalues } from './prophotorgb.js';
import { rec20202srgb, srgb2rec2020values } from './rec2020.js';
import { srgb2xyz_d50, srgb2xyz } from './xyz.js';
import { p32srgbvalues, srgb2p3values } from './p3.js';
import { xyzd502srgb } from './xyzd50.js';
import { colorMix } from './color-mix.js';
import { reduceHexValue, rgb2HexToken, color2HexToken, lch2HexToken, lab2HexToken, oklch2HexToken, oklab2HexToken, cmyk2HexToken, hwb2HexToken, hsl2HexToken } from './hex.js';
import { parseRelativeColor } from './relativecolor.js';
import { color2cmykToken, lch2cmykToken, lab2cmykToken, oklch2cmykToken, oklab2cmyk, hwb2cmykToken, hsl2cmykToken, rgb2cmykToken } from './cmyk.js';
import { a98rgb2srgbvalues, srgb2a98values } from './a98rgb.js';
import '../../renderer/sourcemap/lib/encode.js';

function convertColor(token, to) {
    if (token.kin == ColorKind.SYS ||
        token.kin == ColorKind.DPSYS ||
        (isIdentColor(token) &&
            ('currentcolor'.localeCompare(token.val, undefined, { sensitivity: 'base' }) == 0))) {
        return token;
    }
    if (token.kin == ColorKind.COLOR_MIX && to != ColorKind.COLOR_MIX) {
        const children = token.chi.reduce((acc, t) => {
            if (t.typ == EnumToken.ColorTokenType) {
                acc.push([t]);
            }
            else {
                if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType].includes(t.typ)) {
                    acc[acc.length - 1].push(t);
                }
            }
            return acc;
        }, [[]]);
        token = colorMix(children[0][1], children[0][2], children[1][0], children[1][1], children[2][0], children[2][1]);
        if (token == null) {
            return null;
        }
    }
    if (token.cal == 'rel' && ['rgb', 'hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'].includes(token.val.toLowerCase())) {
        const chi = getComponents(token);
        const offset = token.val == 'color' ? 2 : 1;
        if (chi != null) {
            // @ts-ignore
            const color = chi[1];
            const components = parseRelativeColor(token.val.toLowerCase() == 'color' ? chi[offset].val : token.val, color, chi[offset + 1], chi[offset + 2], chi[offset + 3], chi[offset + 4]);
            if (components != null) {
                token = {
                    ...token,
                    chi: [...(token.val == 'color' ? [chi[offset]] : []), ...Object.values(components)]
                };
                delete token.cal;
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
        const colorSpace = token.chi.find(t => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ));
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
    }
    else if (to == ColorKind.HWB) {
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
    }
    else if (to == ColorKind.DEVICE_CMYK) {
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
    }
    else if (to == ColorKind.HEX || to == ColorKind.LIT) {
        switch (token.kin) {
            case ColorKind.HEX:
            case ColorKind.LIT: {
                const val = reduceHexValue(token.val);
                return {
                    typ: EnumToken.ColorTokenType,
                    val,
                    kin: val[0] == '#' ? ColorKind.HEX : ColorKind.LIT
                };
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
    }
    else if (to == ColorKind.RGB) {
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
    }
    else if (to == ColorKind.LAB) {
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
    }
    else if (to == ColorKind.LCH) {
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
    }
    else if (to == ColorKind.OKLAB) {
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
    }
    else if (to == ColorKind.OKLCH) {
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
    }
    else if (colorFuncColorSpace.includes(ColorKind[to].toLowerCase().replaceAll('_', '-').toLowerCase().replaceAll('_', '-'))) {
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
function hex2colorToken(token, to) {
    const values = hex2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return values2colortoken(values, to);
}
function rgb2colorToken(token, to) {
    const values = rgb2srgb(token);
    if (values == null) {
        return null;
    }
    return values2colortoken(values, to);
}
function hsl2colorToken(token, to) {
    const values = hsl2srgb(token);
    if (values == null) {
        return null;
    }
    return values2colortoken(values, to);
}
function hwb2colorToken(token, to) {
    const values = hwb2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return values2colortoken(values, to);
}
function cmyk2colorToken(token, to) {
    const values = cmyk2rgbvalues(token);
    if (values == null) {
        return null;
    }
    return values2colortoken(values, to);
}
function lab2colorToken(token, to) {
    const values = lab2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return values2colortoken(values, to);
}
function oklab2colorToken(token, to) {
    const values = oklab2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return values2colortoken(values, to);
}
function lch2colorToken(token, to) {
    const values = lch2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return values2colortoken(values, to);
}
function oklch2colorToken(token, to) {
    const values = oklch2srgbvalues(token);
    if (values == null) {
        return null;
    }
    return values2colortoken(values, to);
}
function color2colorToken(token, to) {
    const values = color2srgbvalues(token);
    if (values == null) {
        return null;
    }
    console.error({ srgb: values });
    return values2colortoken(values, to);
}
function srgb2srgbcolorspace(val, to) {
    const values = [];
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
            break;
    }
    return values;
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
    switch (colorSpace.val.toLowerCase()) {
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
function values2colortoken(values, to) {
    // console.error({srgb2: values});
    values = srgb2srgbcolorspace(values, to);
    // console.error({srgb3: values, to: ColorKind[to]});
    const chi = [
        { typ: EnumToken.NumberTokenType, val: String(values[0]) },
        { typ: EnumToken.NumberTokenType, val: String(values[1]) },
        { typ: EnumToken.NumberTokenType, val: String(values[2]) },
    ];
    if (values.length == 4) {
        chi.push({ typ: EnumToken.PercentageTokenType, val: (values[3] * 100).toFixed() });
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
function toPrecisionAngle(angle) {
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

export { cmyk2colorToken, color2colorToken, color2srgbvalues, convertColor, getAngle, getNumber, hex2colorToken, hsl2colorToken, hwb2colorToken, lab2colorToken, lch2colorToken, minmax, oklab2colorToken, oklch2colorToken, rgb2colorToken, toPrecisionAngle };
