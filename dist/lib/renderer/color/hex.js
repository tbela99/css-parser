import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../parser/parse.js';
import { getNumber, minmax } from './color.js';
import { hsl2rgb, hwb2rgb, cmyk2rgb, oklab2rgb, oklch2rgb, lab2rgb, lch2rgb } from './rgb.js';
import { NAMES_COLORS } from './utils/constants.js';
import { getComponents } from './utils/components.js';
import '../sourcemap/lib/encode.js';
import '../../parser/utils/config.js';

function toHexString(acc, value) {
    return acc + value.toString(16).padStart(2, '0');
}
function reduceHexValue(value) {
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
            value = `#${value[1]}${value[3]}${value[5]}${value[7]}`;
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
function rgb2hex(token) {
    let value = '#';
    let t;
    // @ts-ignore
    const components = getComponents(token);
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
        const v = (t.typ == EnumToken.IdenTokenType && t.val == 'none') ? 1 : getNumber(t);
        // @ts-ignore
        if (v < 1) {
            // @ts-ignore
            value += Math.round(255 * getNumber(t)).toString(16).padStart(2, '0');
        }
    }
    return value;
}
function hsl2hex(token) {
    return `${hsl2rgb(token).reduce(toHexString, '#')}`;
}
function hwb2hex(token) {
    return `${hwb2rgb(token).reduce(toHexString, '#')}`;
}
function cmyk2hex(token) {
    return `#${cmyk2rgb(token).reduce(toHexString, '')}`;
}
function oklab2hex(token) {
    return `${oklab2rgb(token).reduce(toHexString, '#')}`;
}
function oklch2hex(token) {
    return `${oklch2rgb(token).reduce(toHexString, '#')}`;
}
function lab2hex(token) {
    return `${lab2rgb(token).reduce(toHexString, '#')}`;
}
function lch2hex(token) {
    return `${lch2rgb(token).reduce(toHexString, '#')}`;
}
function srgb2hexvalues(r, g, b, alpha) {
    return [r, g, b].concat(alpha == null || alpha == 1 ? [] : [alpha]).reduce((acc, value) => acc + minmax(Math.round(255 * value), 0, 255).toString(16).padStart(2, '0'), '#');
}

export { cmyk2hex, expandHexValue, hsl2hex, hwb2hex, lab2hex, lch2hex, oklab2hex, oklch2hex, reduceHexValue, rgb2hex, srgb2hexvalues };
