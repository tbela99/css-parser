import { EnumToken, ColorType } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { color2srgbvalues, getNumber } from './color.js';
import { srgb2rgb, cmyk2rgbvalues, hwb2rgbvalues, hsl2rgbvalues } from './rgb.js';
import { COLORS_NAMES, NAMES_COLORS } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import { lch2srgbvalues, lab2srgbvalues, oklch2srgbvalues, oklab2srgbvalues } from './srgb.js';
import '../../renderer/sourcemap/lib/encode.js';

function toHexString(acc, value) {
    return acc + value.toString(16).padStart(2, '0');
}
function reduceHexValue(value) {
    if (value[0] != '#') {
        value = COLORS_NAMES[value.toLowerCase()] ?? value;
    }
    const named_color = NAMES_COLORS[expandHexValue(value)];
    if (value.length == 7) {
        if (value[1] == value[2] &&
            value[3] == value[4] &&
            value[5] == value[6]) {
            value = `#${value[1]}${value[3]}${value[5]}`;
        }
    }
    else if (value.length == 9) {
        if (value[1] == value[2] &&
            value[3] == value[4] &&
            value[5] == value[6] &&
            value[7] == value[8]) {
            value = `#${value[1]}${value[3]}${value[5]}${value[7] == 'f' ? '' : value[7]}`;
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
function rgb2HexToken(token) {
    let value = rgb2hexvalues(token);
    if (value == null) {
        return null;
    }
    return hexToken(value);
}
function hsl2HexToken(token) {
    let value = hsl2hexvalues(token);
    if (value == null) {
        return null;
    }
    return hexToken(value);
}
function cmyk2HexToken(token) {
    let value = cmyk2hexvalues(token);
    if (value == null) {
        return null;
    }
    return hexToken(value);
}
function hwb2HexToken(token) {
    let value = hwb2hexvalues(token);
    if (value == null) {
        return null;
    }
    return hexToken(value);
}
function color2HexToken(token) {
    let value = color2srgbvalues(token);
    if (value == null) {
        return null;
    }
    return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
}
function oklab2HexToken(token) {
    let value = oklab2srgbvalues(token);
    if (value == null) {
        return null;
    }
    return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
}
function oklch2HexToken(token) {
    let value = oklch2srgbvalues(token);
    if (value == null) {
        return null;
    }
    return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
}
function lab2HexToken(token) {
    let value = lab2srgbvalues(token);
    if (value == null) {
        return null;
    }
    return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
}
function lch2HexToken(token) {
    let value = lch2srgbvalues(token);
    if (value == null) {
        return null;
    }
    return hexToken(value.reduce((acc, curr) => acc + srgb2rgb(curr).toString(16).padStart(2, '0'), '#'));
}
function hexToken(value) {
    value = reduceHexValue(value);
    return {
        typ: EnumToken.ColorTokenType,
        val: value,
        kin: value[0] == '#' ? ColorType.HEX : ColorType.LIT
    };
}
function rgb2hexvalues(token) {
    let value = '#';
    let t;
    // @ts-ignore
    const components = getComponents(token);
    if (components == null || components.length < 3) {
        return null;
    }
    // @ts-ignore
    for (let i = 0; i < 3; i++) {
        // @ts-ignore
        t = components[i];
        // @ts-ignore
        value += (t.typ == EnumToken.Iden && t.val == 'none' ? '0' : Math.round(getNumber(t) * (t.typ == EnumToken.PercentageTokenType ? 255 : 1))).toString(16).padStart(2, '0');
    }
    // @ts-ignore
    if (components.length == 4) {
        // @ts-ignore
        t = components[3];
        // @ts-ignore
        const v = getNumber(t);
        // @ts-ignore
        if (v < 1) {
            // @ts-ignore
            value += Math.round(255 * getNumber(t)).toString(16).padStart(2, '0');
        }
    }
    return value;
}
function hsl2hexvalues(token) {
    const t = hsl2rgbvalues(token);
    if (t == null) {
        return null;
    }
    if (t.length == 4) {
        t[3] = srgb2rgb(t[3]);
    }
    return `${t.reduce(toHexString, '#')}`;
}
function hwb2hexvalues(token) {
    const t = hwb2rgbvalues(token);
    if (t == null) {
        return null;
    }
    if (t.length == 4) {
        t[3] = srgb2rgb(t[3]);
    }
    return `${t.reduce(toHexString, '#')}`;
}
function cmyk2hexvalues(token) {
    const t = cmyk2rgbvalues(token);
    if (t == null) {
        return null;
    }
    if (t.length == 4) {
        t[3] = srgb2rgb(t[3]);
    }
    return `#${t.reduce(toHexString, '')}`;
}

export { cmyk2HexToken, cmyk2hexvalues, color2HexToken, expandHexValue, hsl2HexToken, hsl2hexvalues, hwb2HexToken, hwb2hexvalues, lab2HexToken, lch2HexToken, oklab2HexToken, oklch2HexToken, reduceHexValue, rgb2HexToken, rgb2hexvalues };
