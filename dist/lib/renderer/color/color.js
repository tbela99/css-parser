import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { srgb2rgb, lch2rgb, lab2rgb, oklch2rgb, oklab2rgb, hwb2rgb, hsl2rgb, hex2rgb } from './rgb.js';
import { lch2hsl, srgb2hsl, lab2hsl, oklch2hsl, oklab2hsl, hwb2hsl, hex2hsl, rgb2hsl } from './hsl.js';
import { srgb2hwb, lch2hwb, lab2hwb, oklch2hwb, oklab2hwb, hsl2hwb, rgb2hwb } from './hwb.js';
import { srgb2lab, oklch2lab, oklab2lab, lch2lab, hwb2lab, hsl2lab, rgb2lab, hex2lab } from './lab.js';
import { oklch2lch, oklab2lch, lab2lch, hwb2lch, hsl2lch, rgb2lch, hex2lch } from './lch.js';
import { srgb2oklab, oklch2oklab, lch2oklab, lab2oklab, hwb2oklab, hsl2oklab, rgb2oklab, hex2oklab } from './oklab.js';
import { srgb2oklch, lch2oklch, oklab2oklch, lab2oklch, hwb2oklch, hsl2oklch, rgb2oklch, hex2oklch } from './oklch.js';
import './utils/constants.js';
import { getComponents } from './utils/components.js';
import { xyz2srgb, lsrgb2srgb } from './srgb.js';
import { prophotorgb2srgbvalues } from './prophotorgb.js';
import { a98rgb2srgbvalues } from './a98rgb.js';
import { rec20202srgb } from './rec2020.js';
import { xyzd502srgb } from './xyz.js';
import { p32srgb } from './p3.js';
import '../sourcemap/lib/encode.js';

function color2srgb(token) {
    const components = getComponents(token);
    const colorSpace = components.shift();
    let values = components.map((val) => getNumber(val));
    switch (colorSpace.val) {
        case 'display-p3':
            // @ts-ignore
            values = p32srgb(...values);
            break;
        case 'srgb-linear':
            // @ts-ignore
            values = lsrgb2srgb(...values);
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
    const to = 'hsl';
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
        val: to,
        chi,
        kin: to
    };
}
function values2rgbtoken(values) {
    const to = 'rgb';
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
        val: to,
        chi,
        kin: to
    };
}
function values2hwbtoken(values) {
    const to = 'hwb';
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
        val: to,
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
    return {
        typ: EnumToken.ColorTokenType,
        val: to,
        chi,
        kin: to
    };
}
function convert(token, to) {
    if (token.kin == to) {
        return token;
    }
    let values = [];
    if (token.kin == 'color') {
        values = color2srgb(token);
        switch (to) {
            case 'hsl':
                // @ts-ignore
                return values2hsltoken(srgb2hsl(...values));
            case 'rgb':
            case 'rgba':
                // @ts-ignore
                return values2rgbtoken(srgb2rgb(...values));
            case 'hwb':
                // @ts-ignore
                return values2hwbtoken(srgb2hwb(...values));
            case 'oklab':
                // @ts-ignore
                return values2colortoken(srgb2oklab(...values), 'oklab');
            case 'oklch':
                // @ts-ignore
                return values2colortoken(srgb2oklch(...values), 'oklch');
            case 'lab':
                // @ts-ignore
                return values2colortoken(srgb2lab(...values), 'oklab');
            case 'lch':
                values.push(...lch2hsl(token));
                break;
        }
        return null;
    }
    if (to == 'hsl') {
        switch (token.kin) {
            case 'rgb':
            case 'rgba':
                values.push(...rgb2hsl(token));
                break;
            case 'hex':
            case 'lit':
                values.push(...hex2hsl(token));
                break;
            case 'hwb':
                values.push(...hwb2hsl(token));
                break;
            case 'oklab':
                values.push(...oklab2hsl(token));
                break;
            case 'oklch':
                values.push(...oklch2hsl(token));
                break;
            case 'lab':
                values.push(...lab2hsl(token));
                break;
            case 'lch':
                values.push(...lch2hsl(token));
                break;
        }
        if (values.length > 0) {
            return values2hsltoken(values);
        }
    }
    else if (to == 'hwb') {
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
    }
    else if (to == 'rgb') {
        switch (token.kin) {
            case 'hex':
            case 'lit':
                values.push(...hex2rgb(token));
                break;
            case 'hsl':
                values.push(...hsl2rgb(token));
                break;
            case 'hwb':
                values.push(...hwb2rgb(token));
                break;
            case 'oklab':
                values.push(...oklab2rgb(token));
                break;
            case 'oklch':
                values.push(...oklch2rgb(token));
                break;
            case 'lab':
                values.push(...lab2rgb(token));
                break;
            case 'lch':
                values.push(...lch2rgb(token));
                break;
        }
        if (values.length > 0) {
            return values2rgbtoken(values);
        }
    }
    else if (to == 'lab') {
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
        }
        if (values.length > 0) {
            return values2colortoken(values, to);
        }
    }
    else if (to == 'lch') {
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
        }
        if (values.length > 0) {
            return values2colortoken(values, to);
        }
    }
    else if (to == 'oklab') {
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
        }
        if (values.length > 0) {
            return values2colortoken(values, to);
        }
    }
    else if (to == 'oklch') {
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
        }
        if (values.length > 0) {
            return values2colortoken(values, to);
        }
    }
    return null;
}
function minmax(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/**
 * clamp color values
 * @param token
 */
function clamp(token) {
    if (token.kin == 'rgb' || token.kin == 'rgba') {
        token.chi.filter((token) => ![EnumToken.LiteralTokenType, EnumToken.CommaTokenType, EnumToken.WhitespaceTokenType].includes(token.typ)).forEach((token, index) => {
            if (index <= 2) {
                if (token.typ == EnumToken.NumberTokenType) {
                    token.val = String(minmax(+token.val, 0, 255)); // String(Math.min(255, Math.max(0, +token.val)));
                }
                else if (token.typ == EnumToken.PercentageTokenType) {
                    token.val = String(minmax(+token.val, 0, 100)); // String(Math.min(100, Math.max(0, +token.val)));
                }
            }
            else {
                if (token.typ == EnumToken.NumberTokenType) {
                    token.val = String(minmax(+token.val, 0, 1)); // String(Math.min(1, Math.max(0, +token.val)));
                }
                else if (token.typ == EnumToken.PercentageTokenType) {
                    token.val = String(minmax(+token.val, 0, 100)); // String(Math.min(100, Math.max(0, +token.val)));
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

export { clamp, color2srgb, convert, getAngle, getNumber, minmax, values2hsltoken };
