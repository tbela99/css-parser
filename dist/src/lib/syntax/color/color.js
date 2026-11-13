/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { ColorType, EnumToken } from '../../ast/types.js';
import { color2RgbToken, lch2RgbToken, lab2RgbToken, oklch2RgbToken, oklab2RgbToken, cmyk2RgbToken, hwb2RgbToken, hsl2RgbToken, hex2RgbToken } from './rgb.js';
import { color2HslToken, lch2HslToken, lab2HslToken, oklch2HslToken, oklab2HslToken, cmyk2HslToken, hwb2HslToken, hex2HslToken, rgb2HslToken } from './hsl.js';
import { color2hwbToken, cmyk2hwbToken, lch2hwbToken, lab2hwbToken, oklch2hwbToken, oklab2hwbToken, hsl2hwbToken, rgb2hwbToken } from './hwb.js';
import { color2labToken, oklch2labToken, oklab2labToken, lch2labToken, cmyk2labToken, hwb2labToken, hsl2labToken, rgb2labToken, hex2labToken } from './lab.js';
import { color2lchToken, oklch2lchToken, oklab2lchToken, lab2lchToken, cmyk2lchToken, hwb2lchToken, hsl2lchToken, rgb2lchToken, hex2lchToken } from './lch.js';
import { color2oklabToken, oklch2oklabToken, lch2oklabToken, lab2oklabToken, cmyk2oklabToken, hwb2oklabToken, hsl2oklabToken, rgb2oklabToken, hex2oklabToken } from './oklab.js';
import { color2oklchToken, lch2oklchToken, oklab2oklchToken, lab2oklchToken, cmyk2oklchToken, hwb2oklchToken, hsl2oklchToken, rgb2oklchToken, hex2oklchToken } from './oklch.js';
import { getColorComponents } from './utils/components.js';
import { oklch2srgbvalues, lch2srgbvalues, oklab2srgbvalues, lab2srgbvalues, cmyk2srgbvalues, hwb2srgbvalues, hsl2srgb, rgb2srgb, hex2srgbvalues, xyz2srgb, lsrgb2srgbvalues, srgb2lsrgbvalues } from './srgb.js';
import { prophotorgb2srgbvalues, srgb2prophotorgbvalues } from './prophotorgb.js';
import { rec20202srgb, srgb2rec2020values } from './rec2020.js';
import { srgb2xyz_d65, srgb2xyz } from './xyz.js';
import { lp32srgbvalues, p32srgbvalues, srgb2lp3values, srgb2p3values } from './p3.js';
import { xyzd502srgb } from './xyzd50.js';
import { colorMix } from './color-mix.js';
import { reduceHexValue, rgb2HexToken, color2HexToken, lch2HexToken, lab2HexToken, oklch2HexToken, oklab2HexToken, cmyk2HexToken, hwb2HexToken, hsl2HexToken } from './hex.js';
import { parseRelativeColorComponents } from './relative-color.js';
import { isIdentColor } from '../syntax.js';
import { color2cmykToken, lch2cmykToken, lab2cmykToken, oklch2cmykToken, oklab2cmyk, hwb2cmykToken, hsl2cmykToken, rgb2cmykToken } from './cmyk.js';
import { a98rgb2srgbvalues, srgb2a98values } from './a98rgb.js';
import { colorFuncColorSpace } from '../constants.js';
import { trimArray } from '../../validation/match.js';
import { alpha } from './alpha.js';
import { equalsIgnoreCase } from '../../parser/utils/text.js';

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
function convertColor(arena, token, to) {
    if (arena.colorType[token] == ColorType.SYS ||
        arena.colorType[token] == ColorType.DPSYS ||
        (isIdentColor(arena, token) && "currentcolor" == arena.strings[arena.stringValue[token]])) {
        return token;
    }
    if (arena.colorType[token] == ColorType.ALPHA) {
        const args = arena.tokens(token).filter((token) => arena.dataTypes[token] !== EnumToken.WhitespaceTokenType && arena.dataTypes[token] !== EnumToken.CommentTokenType);
        if (args.length > 1 &&
            arena.dataTypes[args[args.length - 2]] === EnumToken.LiteralTokenType &&
            "/" === arena.strings[arena.stringValue[args[args.length - 2]]]) {
            args.splice(args.length - 2, 1);
        }
        let values = trimArray(arena, args.slice(1));
        const result = alpha(arena, values[0], values[1]);
        if (result == null) {
            return null;
        }
        token = result;
    }
    if (arena.colorType[token] == ColorType.COLOR_MIX && to != ColorType.COLOR_MIX) {
        const children = arena.tokens(token).reduce((acc, t) => {
            if (arena.dataTypes[t] === EnumToken.CommaTokenType) {
                acc.push([]);
            }
            else if (arena.dataTypes[t] !== EnumToken.WhitespaceTokenType && arena.dataTypes[t] !== EnumToken.CommentTokenType) {
                acc[acc.length - 1].push(t);
            }
            return acc;
        }, [[]]);
        const result = colorMix(arena, ...children.flat(2));
        if (result == null) {
            return null;
        }
        token = result;
    }
    if (arena.strings[arena.unit[token]] == "rel" &&
        ["rgb", "hsl", "hwb", "lab", "lch", "oklab", "oklch", "color"].some((t) => equalsIgnoreCase(t, arena.strings[arena.stringValue[token]]))) {
        const chi = getColorComponents(arena, token);
        const offset = arena.strings[arena.stringValue[token]] == "color" ? 2 : 1;
        if (chi != null) {
            // @ts-ignore
            const color = chi[1];
            const components = parseRelativeColorComponents(arena, equalsIgnoreCase(arena.strings[arena.stringValue[token]], "color")
                ? arena.strings[arena.stringValue[chi[offset]]]
                : arena.strings[arena.stringValue[token]], color, chi[offset + 1], chi[offset + 2], chi[offset + 3], chi[offset + 4]);
            if (components == null) {
                return null;
            }
            const name = arena.strings[arena.stringValue[token]];
            const tk = arena.createColor(name, ColorType[name.toUpperCase().replaceAll("-", "_")], name == "color" ? [arena.clone(chi[offset])] : []);
            const seen = new Set();
            for (const t of Object.values(components)) {
                // a component token may be used more than once: rgb(from #ff0 r g r)
                // inlined: arena.take(t)
                arena.appendToken(tk, seen.has(t) ? arena.clone(t, true) : (arena.parents[t] == 0 ? t : arena.clone(t, true)));
                seen.add(t);
            }
            arena.copyLocation(tk, token);
            token = tk;
        }
    }
    if (arena.colorType[token] == to) {
        if (arena.colorType[token] == ColorType.HEX || arena.colorType[token] == ColorType.LIT) {
            const val = reduceHexValue(arena.strings[arena.stringValue[token]]);
            // inlined: arena.setStr(token, val)
            arena.stringValue[token] = arena.internString(val);
            arena.colorType[token] = val[0] == "#" ? ColorType.HEX : ColorType.LIT;
        }
        return token;
    }
    if (arena.colorType[token] == ColorType.COLOR) {
        const colorSpace = arena.findToken(token, (arena, t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(arena.dataTypes[t]));
        if (colorSpace != null &&
            arena.strings[arena.stringValue[colorSpace]] == ColorType[to].toLowerCase().replaceAll("_", "-")) {
            for (const chi of arena.tokens(token)) {
                if (arena.dataTypes[chi] == EnumToken.NumberTokenType && !arena.hasFraction(chi)) {
                    arena.numericValue[chi] = getNumber(arena, chi);
                }
            }
            return token;
        }
    }
    if (to == ColorType.HSL) {
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
    }
    else if (to == ColorType.HWB) {
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
    }
    else if (to == ColorType.DEVICE_CMYK) {
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
    }
    else if (to == ColorType.HEX || to == ColorType.LIT) {
        switch (arena.colorType[token]) {
            case ColorType.HEX:
            case ColorType.LIT: {
                const val = reduceHexValue(arena.strings[arena.stringValue[token]]);
                return arena.createColor(val, val[0] == "#" ? ColorType.HEX : ColorType.LIT);
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
    }
    else if (to == ColorType.RGB) {
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
    }
    else if (to == ColorType.LAB) {
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
    }
    else if (to == ColorType.LCH) {
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
    }
    else if (to == ColorType.OKLAB) {
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
    }
    else if (to == ColorType.OKLCH) {
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
    }
    else if (colorFuncColorSpace.includes(ColorType[to].toLowerCase().replaceAll("_", "-").toLowerCase().replaceAll("_", "-"))) {
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
function hex2colorToken(arena, token, to) {
    const values = hex2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return values2colortoken(arena, values, to);
}
function rgb2colorToken(arena, token, to) {
    const values = rgb2srgb(arena, token);
    if (values == null) {
        return null;
    }
    return values2colortoken(arena, values, to);
}
function hsl2colorToken(arena, token, to) {
    const values = hsl2srgb(arena, token);
    if (values == null) {
        return null;
    }
    return values2colortoken(arena, values, to);
}
function hwb2colorToken(arena, token, to) {
    const values = hwb2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return values2colortoken(arena, values, to);
}
function cmyk2colorToken(arena, token, to) {
    const values = cmyk2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return values2colortoken(arena, values, to);
}
function lab2colorToken(arena, token, to) {
    const values = lab2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return values2colortoken(arena, values, to);
}
function oklab2colorToken(arena, token, to) {
    const values = oklab2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return values2colortoken(arena, values, to);
}
function lch2colorToken(arena, token, to) {
    const values = lch2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return values2colortoken(arena, values, to);
}
function oklch2colorToken(arena, token, to) {
    const values = oklch2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return values2colortoken(arena, values, to);
}
function color2colorToken(arena, token, to) {
    const values = color2srgbvalues(arena, token);
    if (values == null) {
        return null;
    }
    return values2colortoken(arena, values, to);
}
function srgb2srgbcolorspace(val, to) {
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
function minmax(value, min, max) {
    return value < min ? min : value > max ? max : value;
}
function color2srgbvalues(arena, token) {
    const components = getColorComponents(arena, token);
    if (components == null) {
        return null;
    }
    const colorSpace = components.shift();
    let values = components.map((val) => getNumber(arena, val));
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
    if (values.length == 4) {
        values[3] = values[3];
    }
    return values;
}
function values2colortoken(arena, values, to) {
    // @ts-expect-error
    values = srgb2srgbcolorspace(values, to);
    if (values == null) {
        return null;
    }
    const chi = [
        arena.createToken(EnumToken.NumberTokenType, values[0]),
        arena.createToken(EnumToken.NumberTokenType, values[1]),
        arena.createToken(EnumToken.NumberTokenType, values[2]),
    ];
    if (values.length == 4) {
        chi.push(arena.createToken(EnumToken.LiteralTokenType, "/"), arena.createToken(EnumToken.PercentageTokenType, values[3] * 100));
    }
    const colorSpace = ColorType[to].toLowerCase().replaceAll("_", "-");
    return colorFuncColorSpace.includes(colorSpace)
        ? arena.createColor("color", ColorType.COLOR, [arena.createToken(EnumToken.IdenTokenType, colorSpace)].concat(chi))
        : arena.createColor(colorSpace, to, chi);
}
/**
 * numeric value of a number, percentage, fraction or `none` token. percentages are divided by 100
 * @param arena
 * @param token
 */
function getNumber(arena, token) {
    const typ = arena.dataTypes[token];
    if (typ == EnumToken.IdenTokenType && arena.strings[arena.stringValue[token]] == "none") {
        return 0;
    }
    let val;
    const fraction = arena.getFraction(token);
    if (fraction != 0) {
        val = arena.numericValue[arena.firstChild[fraction]] / arena.numericValue[arena.lastChild[fraction]];
    }
    else {
        val = arena.numericValue[token];
    }
    return typ == EnumToken.PercentageTokenType ? val / 100 : val;
}
/**
 * convert angle to turn
 * @param arena
 * @param token
 */
function getAngle(arena, token) {
    const typ = arena.dataTypes[token];
    if (typ == EnumToken.IdenTokenType) {
        if (arena.strings[arena.stringValue[token]] == "none") {
            return 0;
        }
    }
    const val = getNumber(arena, token);
    if (typ == EnumToken.AngleTokenType) {
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

export { cmyk2colorToken, color2colorToken, color2srgbvalues, convertColor, getAngle, getNumber, hex2colorToken, hsl2colorToken, hwb2colorToken, lab2colorToken, lch2colorToken, minmax, oklab2colorToken, oklch2colorToken, rgb2colorToken };
