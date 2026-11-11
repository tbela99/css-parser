/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { EnumToken, ColorType } from '../../ast/types.js';
import { color2srgbvalues, getNumber } from './color.js';
import { srgb2rgb, cmyk2rgbvalues, hwb2rgbvalues, hsl2rgbvalues } from './rgb.js';
import { getColorComponents } from './utils/components.js';
import { lch2srgbvalues, lab2srgbvalues, oklch2srgbvalues, oklab2srgbvalues } from './srgb.js';
import { COLORS_NAMES, NAMES_COLORS } from '../constants.js';

function toHexString(acc, value) {
    return acc + value.toString(16).padStart(2, "0");
}
function reduceHexValue(value) {
    if (value[0] != "#") {
        value = COLORS_NAMES[value.toLowerCase()] ?? value;
    }
    const named_color = NAMES_COLORS[expandHexValue(value)];
    if (value.length == 7) {
        if (value[1] == value[2] && value[3] == value[4] && value[5] == value[6]) {
            value = `#${value[1]}${value[3]}${value[5]}`;
        }
    }
    else if (value.length == 9) {
        if (value[1] == value[2] && value[3] == value[4] && value[5] == value[6] && value[7] == value[8]) {
            value = `#${value[1]}${value[3]}${value[5]}${value[7] == "f" ? "" : value[7]}`;
        }
        if (value.endsWith("ff")) {
            value = value.slice(0, -2);
        }
    }
    return named_color != null && named_color.length <= value.length ? named_color : value;
}
function expandHexValue(value) {
    if (value.length == 4) {
        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }
    if (value.length == 5) {
        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${value[4]}${value[4]}`;
    }
    return value;
}
function rgb2HexToken(arena, token) {
    let value = rgb2hexvalues(arena, token);
    if (value == null) {
        return null;
    }
    return hexToken(arena, value);
}
function hsl2HexToken(arena, token) {
    let value = hsl2hexvalues(arena, token);
    if (value == null) {
        return null;
    }
    return hexToken(arena, value);
}
function cmyk2HexToken(arena, token) {
    let value = cmyk2hexvalues(arena, token);
    if (value == null) {
        return null;
    }
    return hexToken(arena, value);
}
function hwb2HexToken(arena, token) {
    let value = hwb2hexvalues(arena, token);
    if (value == null) {
        return null;
    }
    return hexToken(arena, value);
}
function color2HexToken(arena, token) {
    let value = color2srgbvalues(arena, token);
    if (value == null) {
        return null;
    }
    return hexToken(arena, value.reduce((acc, curr) => acc +
        srgb2rgb(curr + Number.EPSILON)
            .toString(16)
            .padStart(2, "0"), "#"));
}
function oklab2HexToken(arena, token) {
    let value = oklab2srgbvalues(arena, token);
    if (value == null) {
        return null;
    }
    return hexToken(arena, value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, "0"), "#"));
}
function oklch2HexToken(arena, token) {
    let value = oklch2srgbvalues(arena, token);
    if (value == null) {
        return null;
    }
    return hexToken(arena, value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, "0"), "#"));
}
function lab2HexToken(arena, token) {
    let value = lab2srgbvalues(arena, token);
    if (value == null) {
        return null;
    }
    return hexToken(arena, value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, "0"), "#"));
}
function lch2HexToken(arena, token) {
    let value = lch2srgbvalues(arena, token);
    if (value == null) {
        return null;
    }
    return hexToken(arena, value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, "0"), "#"));
}
function hexToken(arena, value) {
    value = reduceHexValue(value);
    return arena.createColor(value, value[0] == "#" ? ColorType.HEX : ColorType.LIT);
}
function rgb2hexvalues(arena, token) {
    let value = "#";
    let t;
    const components = getColorComponents(arena, token);
    if (components == null || components.length < 3) {
        return null;
    }
    for (let i = 0; i < 3; i++) {
        t = components[i];
        value += (arena.dataTypes[t] == EnumToken.Iden && arena.strings[arena.stringValue[t]] == "none"
            ? "0"
            : Math.round(getNumber(arena, t) * (arena.dataTypes[t] == EnumToken.PercentageTokenType ? 255 : 1)))
            .toString(16)
            .padStart(2, "0");
    }
    if (components.length == 4) {
        // @ts-ignore
        t = components[3];
        // @ts-ignore
        const v = getNumber(arena, t);
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
function hsl2hexvalues(arena, token) {
    const t = hsl2rgbvalues(arena, token);
    if (t == null) {
        return null;
    }
    if (t.length == 4) {
        t[3] = srgb2rgb(t[3]);
    }
    return `${t.reduce(toHexString, "#")}`;
}
function hwb2hexvalues(arena, token) {
    const t = hwb2rgbvalues(arena, token);
    if (t == null) {
        return null;
    }
    if (t.length == 4) {
        t[3] = srgb2rgb(t[3]);
    }
    return `${t.reduce(toHexString, "#")}`;
}
function cmyk2hexvalues(arena, token) {
    const t = cmyk2rgbvalues(arena, token);
    if (t == null) {
        return null;
    }
    if (t.length == 4) {
        t[3] = srgb2rgb(t[3]);
    }
    return `#${t.reduce(toHexString, "")}`;
}

export { cmyk2HexToken, cmyk2hexvalues, color2HexToken, expandHexValue, hsl2HexToken, hsl2hexvalues, hwb2HexToken, hwb2hexvalues, lab2HexToken, lch2HexToken, oklab2HexToken, oklch2HexToken, reduceHexValue, rgb2HexToken, rgb2hexvalues };
